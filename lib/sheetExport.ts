import { google } from "googleapis";
import { getSupabaseServiceClient } from "./supabase";
import {
  exportSnapshot,
  sheetFormatRequests,
  type MirrorBooking,
  type MirrorGuest,
  type SheetSnapshot,
  type SheetTab,
} from "./sheetRows";

/**
 * The Google Sheet is a mirror of Supabase. exportAll clears and rewrites
 * both tabs from the database. Nothing in the app ever reads the Sheet.
 */

const BOOKINGS_TAB = "Bookings";

type BookingRow = {
  id: string;
  ref: string;
  table_no: number;
  party_size: number;
  cars: number;
  bus_seats: number;
  contact: string | null;
  status: string;
  amount: number;
  student_id: string | null;
};

type GuestRow = {
  booking_id: string;
  name: string;
  age: string | null;
  dietary: string | null;
  allergy_note: string | null;
  sort_order: number;
};

type StudentRow = {
  id: string;
  name: string;
  preferred_name: string | null;
  family_name: string | null;
};

function studentLabel(student: StudentRow | undefined): string {
  if (!student) return "";
  const display = [student.preferred_name, student.family_name]
    .filter(Boolean)
    .join(" ");
  return display || student.name;
}

export async function loadSnapshot(): Promise<SheetSnapshot> {
  const supabase = getSupabaseServiceClient();
  const [bookingsRes, tablesRes, studentsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, ref, table_no, party_size, cars, bus_seats, contact, status, amount, student_id",
      )
      .neq("status", "cancelled"),
    supabase.from("tables").select("table_no, blocked"),
    supabase.from("students").select("id, name, preferred_name, family_name"),
  ]);

  if (bookingsRes.error) throw bookingsRes.error;
  if (tablesRes.error) throw tablesRes.error;
  if (studentsRes.error) throw studentsRes.error;

  const bookingRows = (bookingsRes.data ?? []) as BookingRow[];
  const ids = bookingRows.map((row) => row.id);
  let guestRows: GuestRow[] = [];
  if (ids.length > 0) {
    const guestsRes = await supabase
      .from("guests")
      .select("booking_id, name, age, dietary, allergy_note, sort_order")
      .in("booking_id", ids);
    if (guestsRes.error) throw guestsRes.error;
    guestRows = (guestsRes.data ?? []) as GuestRow[];
  }

  const students = new Map(
    ((studentsRes.data ?? []) as StudentRow[]).map((row) => [row.id, row]),
  );
  const guestsByBooking = new Map<string, MirrorGuest[]>();
  for (const guest of guestRows) {
    const list = guestsByBooking.get(guest.booking_id) ?? [];
    list.push({
      name: guest.name,
      age: guest.age ?? "",
      dietary: guest.dietary ?? "",
      allergyNote: guest.allergy_note ?? "",
      sortOrder: guest.sort_order,
    });
    guestsByBooking.set(guest.booking_id, list);
  }

  const bookings: MirrorBooking[] = bookingRows.map((row) => ({
    ref: row.ref,
    student: studentLabel(
      row.student_id ? students.get(row.student_id) : undefined,
    ),
    tableNo: row.table_no,
    partySize: row.party_size,
    cars: row.cars,
    busSeats: row.bus_seats,
    contact: row.contact ?? "",
    status: row.status,
    amount: row.amount,
    guests: guestsByBooking.get(row.id) ?? [],
  }));

  return {
    tables: ((tablesRes.data ?? []) as { table_no: number; blocked: boolean }[]).map(
      (row) => ({ tableNo: row.table_no, blocked: row.blocked }),
    ),
    bookings,
  };
}

type SheetProperties = {
  sheetId?: number | null;
  title?: string | null;
};

type SheetsApi = {
  spreadsheets: {
    get: (args: { spreadsheetId: string }) => Promise<{
      data: { sheets?: { properties?: SheetProperties }[] };
    }>;
    batchUpdate: (args: {
      spreadsheetId: string;
      requestBody: { requests: object[] };
    }) => Promise<unknown>;
    values: {
      clear: (args: { spreadsheetId: string; range: string }) => Promise<unknown>;
      update: (args: {
        spreadsheetId: string;
        range: string;
        valueInputOption: string;
        requestBody: { values: string[][] };
      }) => Promise<unknown>;
    };
  };
};

function requireSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEET_ID");
  return id;
}

function sheetsClient(): SheetsApi {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  let creds: { client_email?: string; private_key?: string };
  try {
    creds = JSON.parse(raw) as { client_email?: string; private_key?: string };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!creds.client_email || !creds.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key",
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth }) as unknown as SheetsApi;
}

async function ensureTabs(
  sheets: SheetsApi,
  spreadsheetId: string,
  titles: string[],
): Promise<Map<string, number>> {
  const existing = await sheets.spreadsheets.get({ spreadsheetId });
  const props = (existing.data.sheets ?? [])
    .map((sheet) => sheet.properties)
    .filter((item): item is SheetProperties => Boolean(item));
  const byTitle = new Map<string, number>();
  for (const item of props) {
    if (item.title && item.sheetId != null) byTitle.set(item.title, item.sheetId);
  }

  const requests: object[] = [];
  for (const title of titles) {
    if (byTitle.has(title)) continue;
    if (title === BOOKINGS_TAB && byTitle.has("Sheet1")) {
      requests.push({
        updateSheetProperties: {
          properties: { sheetId: byTitle.get("Sheet1"), title: BOOKINGS_TAB },
          fields: "title",
        },
      });
      byTitle.set(BOOKINGS_TAB, byTitle.get("Sheet1") as number);
      byTitle.delete("Sheet1");
      continue;
    }
    requests.push({ addSheet: { properties: { title } } });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
    const refreshed = await sheets.spreadsheets.get({ spreadsheetId });
    byTitle.clear();
    for (const sheet of refreshed.data.sheets ?? []) {
      const item = sheet.properties;
      if (item?.title && item.sheetId != null) byTitle.set(item.title, item.sheetId);
    }
  }

  return byTitle;
}

export async function writeTabs(tabs: SheetTab[]): Promise<void> {
  const spreadsheetId = requireSheetId();
  const sheets = sheetsClient();
  const ids = await ensureTabs(
    sheets,
    spreadsheetId,
    tabs.map((tab) => tab.title),
  );

  for (const tab of tabs) {
    const sheetId = ids.get(tab.title);
    if (sheetId == null) throw new Error(`Sheet tab "${tab.title}" was not created`);
    const range = `'${tab.title.replace(/'/g, "''")}'`;
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${range}!A:Z`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${range}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: tab.rows },
    });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: sheetFormatRequests(sheetId, tab.boldRows),
      },
    });
  }
}

export async function exportAll(overrides?: {
  load?: () => Promise<SheetSnapshot>;
  write?: (tabs: SheetTab[]) => Promise<void>;
}): Promise<SheetTab[]> {
  return exportSnapshot({
    load: overrides?.load ?? loadSnapshot,
    write: overrides?.write ?? writeTabs,
  });
}

/** Sheet problems are logged and swallowed. The booking itself still stands. */
export async function syncSheetQuietly(): Promise<void> {
  try {
    await exportAll();
  } catch (error) {
    console.error(
      "Sheet export failed; Supabase was not rolled back.",
      error instanceof Error ? error.message : error,
    );
  }
}
