/**
 * Audit-only: compare the live Supabase project to what the app expects.
 * Does not apply DDL. Loads keys from .env.local.
 *
 *   node --experimental-strip-types scripts/verify-db.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadLocalEnv(): void {
  const path = resolve(import.meta.dirname, "../.env.local");
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";

/** App price (lib/pricing.ts). 4 party − 2 comps × 218 = 436, not 240. */
const SEAT_PRICE = 218;
const TABLE_CAPACITY = 10;
const PARTY = 4;
const BUS_SEATS = 2;
const CARS = 1;
const CONTACT = "+65 8111 0000";
const TEST_EMAIL = "db-verify@gala.invalid";

/**
 * sql/01_schema.sql seeds 6, 15, 88. lib/config.ts has no blocked-table list;
 * this is the only source of truth in the repo.
 */
const EXPECTED_BLOCKED = [6, 15, 88];

const EXPECTED_STUDENTS: { name: string; comp_seats: number }[] = [
  { name: "Aryan Tan", comp_seats: 2 },
  { name: "Aryan Mehta", comp_seats: 2 },
  { name: "Mei Ling Wong", comp_seats: 2 },
  { name: "Zara Binte Rahman", comp_seats: 0 },
  { name: "Joshua Lim", comp_seats: 0 },
  { name: "Priya Krishnan", comp_seats: 0 },
  { name: "Min-Jun Park", comp_seats: 0 },
  { name: "Chloe Van Der Berg", comp_seats: 0 },
  { name: "Kabir Shah", comp_seats: 0 },
  { name: "Isabella Chen", comp_seats: 0 },
];

const SCHEMA_COLUMNS: Record<string, string[]> = {
  students: ["id", "name", "grade", "comp_seats"],
  tables: ["table_no", "blocked"],
  bookings: [
    "id",
    "ref",
    "student_id",
    "table_no",
    "party_size",
    "cars",
    "bus_seats",
    "contact",
    "email",
    "amount",
    "status",
    "created_at",
  ],
  guests: ["id", "booking_id", "name", "age", "dietary", "allergy_note", "sort_order"],
};

function sqlFile(name: string): string {
  return readFileSync(resolve(import.meta.dirname, `../sql/${name}`), "utf8").trim();
}

const SQL = {
  schema: sqlFile("01_schema.sql"),
  compSeats: sqlFile("04_comp_seats.sql"),
  seedStudents: sqlFile("03_seed.sql"),
  seedTables: `insert into tables (table_no, blocked)
select g, g in (6, 15, 88)
from generate_series(1, 100) as g
on conflict (table_no) do update set blocked = excluded.blocked;

delete from tables where table_no < 1 or table_no > 100;`,
  rpc: sqlFile("02_create_booking.sql"),
  missingColumn: (table: string, column: string) => {
    if (table === "students" && column === "comp_seats") {
      return sqlFile("04_comp_seats.sql");
    }
    return `-- Missing ${table}.${column}. Create it to match sql/01_schema.sql.`;
  },
  rls: `alter table students enable row level security;
alter table tables enable row level security;
alter table bookings enable row level security;
alter table guests enable row level security;

drop policy if exists students_select on students;
create policy students_select on students
  for select to anon, authenticated
  using (true);

drop policy if exists tables_select on tables;
create policy tables_select on tables
  for select to anon, authenticated
  using (true);

drop policy if exists bookings_select on bookings;
create policy bookings_select on bookings
  for select to anon, authenticated
  using (true);

drop policy if exists bookings_update_email on bookings;
create policy bookings_update_email on bookings
  for update to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on students, tables, bookings to anon, authenticated;
grant all on students, tables, bookings, guests to service_role;
grant usage, select on sequence booking_ref_seq to anon, authenticated, service_role;

revoke insert, update, delete on bookings from anon, authenticated;
grant select on bookings to anon, authenticated;
grant update (email) on bookings to anon, authenticated;
revoke all on guests from anon, authenticated;

revoke all on function create_booking(
  integer, integer, uuid, jsonb, integer, integer, text, text
) from public;
grant execute on function create_booking(
  integer, integer, uuid, jsonb, integer, integer, text, text
) to anon, authenticated, service_role;`,
  amount: `-- create_booking must use seat price 218 (lib/pricing.ts):
--   v_seat_price integer := 218;
--   v_amount := greatest(p_party_size - v_comp, 0) * v_seat_price;
-- Party 4 with 2 comps is 436, not 240.`,
};

type Fix = { title: string; sql: string; order: number };

const fixes: Fix[] = [];
const results: { ok: boolean; line: string }[] = [];
let emptyProject = false;

function pass(label: string, detail: string) {
  const line = `PASS  ${label}: ${detail}`;
  results.push({ ok: true, line });
  console.log(line);
}

function fail(label: string, detail: string, fix?: Fix) {
  const line = `FAIL  ${label}: ${detail}`;
  results.push({ ok: false, line });
  console.log(line);
  if (fix) {
    if (!fixes.some((f) => f.title === fix.title && f.sql === fix.sql)) {
      fixes.push(fix);
    }
  }
}

function errMsg(error: { message?: string } | null | undefined): string {
  return error?.message?.replace(/\s+/g, " ").trim() || "unknown error";
}

async function columnsMissing(
  client: SupabaseClient,
  table: string,
  columns: string[],
): Promise<{ missingTable: boolean; missing: string[]; error?: string }> {
  const { error: tableError } = await client.from(table).select("*").limit(0);
  if (tableError) {
    const msg = errMsg(tableError);
    if (/could not find the table|schema cache|does not exist/i.test(msg)) {
      return { missingTable: true, missing: columns, error: msg };
    }
  }

  const missing: string[] = [];
  for (const column of columns) {
    const { error } = await client.from(table).select(column).limit(0);
    if (error) {
      const msg = errMsg(error);
      if (
        /column|does not exist|could not find|schema cache/i.test(msg)
      ) {
        missing.push(column);
      } else if (/could not find the table/i.test(msg)) {
        return { missingTable: true, missing: columns, error: msg };
      } else {
        return { missingTable: false, missing: [column], error: msg };
      }
    }
  }
  return { missingTable: false, missing };
}

type Created = { id: string; ref: string; amount: number; status: string };

async function rpcCreate(
  client: SupabaseClient,
  args: {
    p_table_no: number;
    p_party_size: number;
    p_student_id: string | null;
    p_guests: unknown;
    p_cars: number;
    p_bus_seats: number;
    p_contact: string | null;
    p_email: string | null;
  },
) {
  return client.rpc("create_booking", args);
}

async function cleanupTestBookings(service: SupabaseClient, extraIds: string[]) {
  const ids = [...extraIds];
  const { data } = await service
    .from("bookings")
    .select("id")
    .eq("email", TEST_EMAIL);
  for (const row of data ?? []) ids.push(row.id as string);
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return;
  await service.from("guests").delete().in("booking_id", unique);
  await service.from("bookings").delete().in("id", unique);
}

async function findOpenTable(
  service: SupabaseClient,
): Promise<{ tableNo: number; remaining: number } | null> {
  const { data: tables, error: tablesError } = await service
    .from("tables")
    .select("table_no, blocked")
    .eq("blocked", false)
    .order("table_no", { ascending: false });
  if (tablesError || !tables?.length) return null;

  const { data: bookings, error: bookingsError } = await service
    .from("bookings")
    .select("table_no, party_size, status")
    .neq("status", "cancelled");
  if (bookingsError) return null;

  const booked = new Map<number, number>();
  for (const row of bookings ?? []) {
    const no = row.table_no as number;
    booked.set(no, (booked.get(no) ?? 0) + (row.party_size as number));
  }

  for (const row of tables) {
    const tableNo = row.table_no as number;
    const remaining = TABLE_CAPACITY - (booked.get(tableNo) ?? 0);
    if (remaining >= PARTY) return { tableNo, remaining };
  }
  return null;
}

async function main() {
  console.log("GalaWeb Supabase audit (read/check only; no DDL)\n");

  if (!SUPABASE_URL || !PUBLISHABLE || !SECRET) {
    fail(
      "Connection",
      `missing env: ${[
        !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
        !PUBLISHABLE && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        !SECRET && "SUPABASE_SECRET_KEY",
      ]
        .filter(Boolean)
        .join(", ")} in .env.local`,
    );
    printSummary();
    process.exit(1);
  }

  const anon = createClient(SUPABASE_URL, PUBLISHABLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const service = createClient(SUPABASE_URL, SECRET, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const createdIds: string[] = [];

  try {
    const { error: pingError } = await service.from("students").select("id").limit(1);
    if (
      pingError &&
      /fetch|network|enotfound|failed to fetch|invalid api key|jwt/i.test(
        errMsg(pingError),
      )
    ) {
      fail("Connection", errMsg(pingError));
      printSummary();
      process.exit(1);
    }
    pass("Connection", `client reached ${new URL(SUPABASE_URL).host}`);

    const schemaGaps: string[] = [];
    for (const [table, columns] of Object.entries(SCHEMA_COLUMNS)) {
      const result = await columnsMissing(service, table, columns);
      if (result.missingTable) {
        schemaGaps.push(`table ${table} missing (${result.error ?? "not in schema cache"})`);
      } else if (result.missing.length) {
        schemaGaps.push(
          `${table} missing column(s) ${result.missing.join(", ")}` +
            (result.error ? ` (${result.error})` : ""),
        );
        for (const column of result.missing) {
          fixes.push({
            title: `Add ${table}.${column}`,
            sql: SQL.missingColumn(table, column),
            order: table === "students" && column === "comp_seats" ? 2 : 1,
          });
        }
      }
    }
    emptyProject = schemaGaps.every((gap) => gap.startsWith("table ")) &&
      schemaGaps.length === Object.keys(SCHEMA_COLUMNS).length;
    if (schemaGaps.length) {
      fail("Schema", schemaGaps.join("; "), {
        title: "1. sql/01_schema.sql — create tables, sequence, RLS, table rows 1–100",
        sql: SQL.schema,
        order: 1,
      });
      if (emptyProject) {
        fixes.push({
          title: "2. sql/04_comp_seats.sql — add students.comp_seats",
          sql: SQL.compSeats,
          order: 2,
        });
      }
    } else {
      pass(
        "Schema",
        "students, tables, bookings, guests exist with the columns the app uses (including students.comp_seats)",
      );
    }

    const { data: studentRows, error: studentError } = await service
      .from("students")
      .select("name, comp_seats");
    const seedIssues: string[] = [];
    if (studentError) {
      seedIssues.push(`could not read students: ${errMsg(studentError)}`);
    } else {
      const rows = (studentRows ?? []) as { name: string; comp_seats: number }[];
      const expectedNames = EXPECTED_STUDENTS.map((s) => s.name).sort();
      const actualNames = rows.map((s) => s.name).sort();
      if (rows.length !== 10) {
        seedIssues.push(`students has ${rows.length} row(s), expected exactly 10`);
      }
      const missingNames = expectedNames.filter((n) => !actualNames.includes(n));
      const extraNames = actualNames.filter((n) => !expectedNames.includes(n));
      if (missingNames.length) {
        seedIssues.push(`missing names: ${missingNames.join(", ")}`);
      }
      if (extraNames.length) {
        seedIssues.push(`unexpected names: ${extraNames.join(", ")}`);
      }
      for (const expected of EXPECTED_STUDENTS) {
        const row = rows.find((r) => r.name === expected.name);
        if (!row) continue;
        const comps = Number(row.comp_seats);
        if (comps !== expected.comp_seats) {
          seedIssues.push(
            `${expected.name} comp_seats=${comps}, expected ${expected.comp_seats}`,
          );
        }
      }
    }

    const { data: tableRows, error: tableError } = await service
      .from("tables")
      .select("table_no, blocked")
      .order("table_no", { ascending: true });
    let blockedFromDb: number[] = [];
    if (tableError) {
      seedIssues.push(`could not read tables: ${errMsg(tableError)}`);
    } else {
      const rows = (tableRows ?? []) as { table_no: number; blocked: boolean }[];
      if (rows.length !== 100) {
        seedIssues.push(`tables has ${rows.length} row(s), expected 100`);
      }
      const nos = rows.map((r) => r.table_no).sort((a, b) => a - b);
      const expectedNos = Array.from({ length: 100 }, (_, i) => i + 1);
      const missingNos = expectedNos.filter((n) => !nos.includes(n));
      const extraNos = nos.filter((n) => n < 1 || n > 100);
      if (missingNos.length) {
        seedIssues.push(
          `missing table_no ${missingNos.slice(0, 12).join(", ")}${missingNos.length > 12 ? "…" : ""}`,
        );
      }
      if (extraNos.length) {
        seedIssues.push(`table_no outside 1–100: ${extraNos.join(", ")}`);
      }
      blockedFromDb = rows
        .filter((r) => r.blocked)
        .map((r) => r.table_no)
        .sort((a, b) => a - b);
      const expectedBlocked = [...EXPECTED_BLOCKED].sort((a, b) => a - b);
      if (blockedFromDb.join(",") !== expectedBlocked.join(",")) {
        seedIssues.push(
          `blocked tables [${blockedFromDb.join(", ") || "none"}]; expected [${expectedBlocked.join(", ")}] from sql/01_schema.sql (lib/config.ts does not export a blocked-table list)`,
        );
      }
    }

    if (seedIssues.length) {
      const studentFail = seedIssues.some((s) => /student|name|comp_seats/i.test(s));
      const tableFail = seedIssues.some((s) => /table/i.test(s));
      fail("Seed", seedIssues.join("; "), {
        title: studentFail && !tableFail ? "Reseed students" : tableFail && !studentFail ? "Reseed tables" : "Reseed students and tables",
        sql: [studentFail ? SQL.seedStudents : "", tableFail ? SQL.seedTables : ""]
          .filter(Boolean)
          .join("\n\n"),
        order: 3,
      });
    } else {
      pass(
        "Seed",
        "10 test students (Aryan Tan / Aryan Mehta / Mei Ling Wong comp_seats=2, other 7 = 0); 100 tables; blocked 6, 15, 88",
      );
    }

    const probe = await rpcCreate(service, {
      p_table_no: 1,
      p_party_size: 0,
      p_student_id: "00000000-0000-0000-0000-000000000000",
      p_guests: [],
      p_cars: 0,
      p_bus_seats: 0,
      p_contact: null,
      p_email: null,
    });
    const probeMsg = errMsg(probe.error);
    if (!probe.error) {
      fail(
        "RPC",
        "create_booking accepted party_size 0 (expected invalid party_size)",
        { title: "Replace create_booking", sql: SQL.rpc, order: 4 },
      );
      const accidental = probe.data as Created | null;
      if (accidental?.id) createdIds.push(accidental.id);
    } else if (/could not find the function|schema cache/i.test(probeMsg)) {
      fail("RPC", `create_booking is missing or signature does not match the app (${probeMsg})`, {
        title: "Create create_booking",
        sql: SQL.rpc,
        order: 4,
      });
    } else if (/invalid party_size/i.test(probeMsg)) {
      pass("RPC", "create_booking exists and is callable (rejected party_size 0 as expected)");
    } else {
      fail(
        "RPC",
        `callable but unexpected probe error: ${probeMsg}`,
        { title: "Replace create_booking", sql: SQL.rpc, order: 4 },
      );
    }

    const rlsIssues: string[] = [];
    const { data: sRead, error: sErr } = await anon.from("students").select("id, name, comp_seats").limit(1);
    if (sErr) rlsIssues.push(`students not readable: ${errMsg(sErr)}`);
    const { data: tRead, error: tErr } = await anon.from("tables").select("table_no, blocked").limit(1);
    if (tErr) rlsIssues.push(`tables not readable: ${errMsg(tErr)}`);
    const { data: bRead, error: bErr } = await anon.from("bookings").select("ref, status").limit(1);
    if (bErr) rlsIssues.push(`bookings not readable: ${errMsg(bErr)}`);

    const insertRef = `GALA-VERIFY-${Date.now()}`;
    const { data: inserted, error: insertErr } = await anon.from("bookings").insert({
      ref: insertRef,
      status: "awaiting_payment",
      table_no: blockedFromDb[0] ?? EXPECTED_BLOCKED[0],
      party_size: 1,
      amount: 0,
    }).select("id");
    if (!insertErr) {
      rlsIssues.push("direct insert into bookings SUCCEEDED (must be rejected)");
      const leakedId = inserted?.[0]?.id as string | undefined;
      if (leakedId) {
        await service.from("bookings").delete().eq("id", leakedId);
      } else {
        await service.from("bookings").delete().eq("ref", insertRef);
      }
    }

    const readableOk = !sErr && !tErr && !bErr;
    const insertRejected = Boolean(insertErr);
    if (rlsIssues.length) {
      fail("RLS", rlsIssues.join("; "), {
        title: "Repair RLS / grants",
        sql: SQL.rls,
        order: 5,
      });
    } else {
      pass(
        "RLS",
        `publishable key: students readable (${sRead?.length ?? 0} row sample), tables readable (${tRead?.length ?? 0}), bookings readable (${bRead?.length ?? 0}); direct bookings insert rejected (${errMsg(insertErr)})`,
      );
    }
    void readableOk;
    void insertRejected;

    await cleanupTestBookings(service, createdIds);

    const { data: aryan, error: aryanErr } = await service
      .from("students")
      .select("id, name, comp_seats")
      .eq("name", "Aryan Tan")
      .maybeSingle();

    const expectedAmount = Math.max(PARTY - 2, 0) * SEAT_PRICE;
    let roundTripBooking: Created | null = null;
    const guestsPayload = [
      { name: "Guest One", age: "18", dietary: "Chicken", allergy_note: "" },
      { name: "Guest Two", age: "47", dietary: "Vegetarian", allergy_note: "Peanuts" },
    ];

    if (aryanErr || !aryan?.id) {
      fail(
        "Round-trip",
        `could not load Aryan Tan: ${aryanErr ? errMsg(aryanErr) : "no row"}`,
        { title: "Reseed students", sql: SQL.seedStudents, order: 3 },
      );
    } else {
      const open = await findOpenTable(service);
      if (!open) {
        fail(
          "Round-trip",
          "no open table with ≥4 remaining seats",
          { title: "Reseed tables", sql: SQL.seedTables, order: 3 },
        );
      } else {
        const created = await rpcCreate(service, {
          p_table_no: open.tableNo,
          p_party_size: PARTY,
          p_student_id: aryan.id,
          p_guests: guestsPayload,
          p_cars: CARS,
          p_bus_seats: BUS_SEATS,
          p_contact: CONTACT,
          p_email: TEST_EMAIL,
        });
        if (created.error || !created.data) {
          fail(
            "Round-trip",
            `create_booking failed: ${errMsg(created.error)}`,
            { title: "Replace create_booking", sql: SQL.rpc, order: 4 },
          );
        } else {
          roundTripBooking = created.data as Created;
          if (roundTripBooking.id) createdIds.push(roundTripBooking.id);

          const issues: string[] = [];
          if (!/^GALA-\d{4}$/.test(roundTripBooking.ref ?? "")) {
            issues.push(`ref ${JSON.stringify(roundTripBooking.ref)} (expected GALA-NNNN)`);
          }
          if (roundTripBooking.amount !== expectedAmount) {
            issues.push(
              `RPC amount=${roundTripBooking.amount}, expected ${expectedAmount} (party ${PARTY} − 2 comps × $${SEAT_PRICE}; 240 would be 2×$120)`,
            );
          }
          if (roundTripBooking.status !== "awaiting_payment") {
            issues.push(`RPC status=${roundTripBooking.status}, expected awaiting_payment`);
          }

          const { data: bookingRow, error: bookingRowErr } = await service
            .from("bookings")
            .select(
              "ref, student_id, table_no, party_size, cars, bus_seats, contact, email, amount, status, created_at",
            )
            .eq("id", roundTripBooking.id)
            .maybeSingle();

          if (bookingRowErr || !bookingRow) {
            issues.push(`booking row missing: ${bookingRowErr ? errMsg(bookingRowErr) : "not found"}`);
          } else {
            if (bookingRow.amount !== expectedAmount) {
              issues.push(`row amount=${bookingRow.amount}, expected ${expectedAmount}`);
            }
            if (bookingRow.status !== "awaiting_payment") {
              issues.push(`row status=${bookingRow.status}, expected awaiting_payment`);
            }
            if (bookingRow.student_id !== aryan.id) issues.push("student_id mismatch");
            if (bookingRow.table_no !== open.tableNo) issues.push("table_no mismatch");
            if (bookingRow.party_size !== PARTY) issues.push("party_size mismatch");
            if (bookingRow.cars !== CARS) issues.push(`cars=${bookingRow.cars}`);
            if (bookingRow.bus_seats !== BUS_SEATS) issues.push(`bus_seats=${bookingRow.bus_seats}`);
            if (bookingRow.contact !== CONTACT) issues.push("contact mismatch");
            if (!bookingRow.created_at) issues.push("created_at empty");
          }

          const { data: guestRows, error: guestErr } = await service
            .from("guests")
            .select("name, dietary, allergy_note, sort_order")
            .eq("booking_id", roundTripBooking.id)
            .order("sort_order", { ascending: true });

          if (guestErr) {
            issues.push(`guests unreadable via service: ${errMsg(guestErr)}`);
          } else {
            const persisted = guestRows ?? [];
            if (persisted.length !== 2) {
              issues.push(`guest count ${persisted.length}, expected 2`);
            }
            const dietaries = persisted.map((g) => g.dietary);
            if (dietaries[0] !== "Chicken" || dietaries[1] !== "Vegetarian") {
              issues.push(`guest dietary values ${JSON.stringify(dietaries)}`);
            }
          }

          if (issues.length) {
            fail("Round-trip", issues.join("; "), {
              title: "Replace create_booking",
              sql: roundTripBooking.amount !== expectedAmount ? `${SQL.rpc}\n-- amount check:\n${SQL.amount}` : SQL.rpc,
              order: 4,
            });
          } else {
            pass(
              "Round-trip",
              `${roundTripBooking.ref} table ${open.tableNo}, amount ${expectedAmount}, awaiting_payment, 2 guests (Chicken / Vegetarian)`,
            );
          }

          const { data: guestAnon, error: guestAnonErr } = await anon
            .from("guests")
            .select("id, name, dietary")
            .eq("booking_id", roundTripBooking.id);
          if (!guestAnonErr && (guestAnon?.length ?? 0) > 0) {
            fail(
              "RLS guests",
              `publishable key read ${guestAnon?.length} guest row(s) (must not be readable)`,
              { title: "Repair RLS / grants", sql: SQL.rls, order: 5 },
            );
          } else {
            pass(
              "RLS guests",
              guestAnonErr
                ? `publishable key cannot read guests (${errMsg(guestAnonErr)})`
                : "publishable key select returned no guest rows",
            );
          }
        }
      }
    }

    if (aryan?.id) {
      const bus = await rpcCreate(service, {
        p_table_no: EXPECTED_BLOCKED.includes(1) ? 2 : 1,
        p_party_size: PARTY,
        p_student_id: aryan.id,
        p_guests: [],
        p_cars: 0,
        p_bus_seats: 5,
        p_contact: CONTACT,
        p_email: TEST_EMAIL,
      });
      if (!bus.error) {
        const leaked = bus.data as Created | null;
        if (leaked?.id) createdIds.push(leaked.id);
        fail(
          "Round-trip bus cap",
          "bus_seats 5 on party 4 was accepted",
          { title: "Replace create_booking", sql: SQL.rpc, order: 4 },
        );
      } else if (/bus_seats exceeds party_size/i.test(errMsg(bus.error))) {
        pass("Round-trip bus cap", "bus_seats 5 on party 4 rejected");
      } else {
        fail(
          "Round-trip bus cap",
          `rejected for the wrong reason: ${errMsg(bus.error)}`,
          { title: "Replace create_booking", sql: SQL.rpc, order: 4 },
        );
      }

      const blockedNo = blockedFromDb[0] ?? EXPECTED_BLOCKED[0];
      const blocked = await rpcCreate(service, {
        p_table_no: blockedNo,
        p_party_size: PARTY,
        p_student_id: aryan.id,
        p_guests: [],
        p_cars: 0,
        p_bus_seats: 0,
        p_contact: CONTACT,
        p_email: TEST_EMAIL,
      });
      if (!blocked.error) {
        const leaked = blocked.data as Created | null;
        if (leaked?.id) createdIds.push(leaked.id);
        fail(
          "Round-trip blocked table",
          `table ${blockedNo} was accepted`,
          { title: "Reseed tables + replace create_booking", sql: `${SQL.seedTables}\n\n${SQL.rpc}`, order: 3 },
        );
      } else if (
        new RegExp(`capacity:${blockedNo}\\b`).test(errMsg(blocked.error)) ||
        /blocked/i.test(errMsg(blocked.error))
      ) {
        pass(
          "Round-trip blocked table",
          `table ${blockedNo} rejected (${errMsg(blocked.error)})`,
        );
      } else {
        fail(
          "Round-trip blocked table",
          `table ${blockedNo} rejected for the wrong reason: ${errMsg(blocked.error)}`,
          { title: "Replace create_booking", sql: SQL.rpc, order: 4 },
        );
      }
    } else {
      fail("Round-trip bus cap", "skipped — Aryan Tan not found");
      fail("Round-trip blocked table", "skipped — Aryan Tan not found");
    }
  } finally {
    await cleanupTestBookings(service, createdIds);
    const { data: leftover } = await service
      .from("bookings")
      .select("id")
      .eq("email", TEST_EMAIL);
    if (leftover?.length) {
      fail("Cleanup", `${leftover.length} test booking(s) still present`);
    } else {
      pass("Cleanup", "test booking + guests deleted");
    }
  }

  printSummary();
  if (results.some((r) => !r.ok)) process.exit(1);
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log("");
  if (failed.length === 0) {
    console.log("No SQL to paste — database matches what the app expects.");
    return;
  }
  console.log("SQL to paste in the Supabase SQL editor (do not auto-run from this script)");
  console.log("Order: 01_schema.sql → 04_comp_seats.sql → 03_seed.sql → 02_create_booking.sql\n");
  if (emptyProject) {
    for (const [title, sql] of [
      ["1. sql/01_schema.sql — tables, sequence, RLS, tables 1–100 (blocked 6, 15, 88)", SQL.schema],
      ["2. sql/04_comp_seats.sql — students.comp_seats", SQL.compSeats],
      ["3. sql/03_seed.sql — 10 test students", SQL.seedStudents],
      ["4. sql/02_create_booking.sql — create_booking RPC", SQL.rpc],
    ] as const) {
      console.log(`-- ${title}`);
      console.log(sql.trim());
      console.log("");
    }
    return;
  }
  const ordered = [...fixes].sort((a, b) => a.order - b.order);
  for (const fix of ordered) {
    console.log(`-- ${fix.title}`);
    console.log(fix.sql.trim());
    console.log("");
  }
}

main().catch((error) => {
  console.error("FAIL  Audit crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
