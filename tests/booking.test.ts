import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./loadEnv.ts";

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const secret = process.env.SUPABASE_SECRET_KEY ?? "";

const client = createClient(url, publishable);
const service = createClient(url, secret);

const TABLE_NO = 99;
const createdRefs: string[] = [];

type Created = { id: string; ref: string; amount: number; status: string };

async function createBooking(input: {
  tableNo: number;
  partySize: number;
  studentId: string;
  guests: {
    name: string;
    age?: string;
    dietary?: string;
    allergyNote?: string;
  }[];
  cars: number;
  busSeats: number;
  contact?: string | null;
  email?: string | null;
}): Promise<Created> {
  const { data, error } = await client.rpc("create_booking", {
    p_table_no: input.tableNo,
    p_party_size: input.partySize,
    p_student_id: input.studentId,
    p_guests: input.guests.map((guest) => ({
      name: guest.name,
      age: guest.age ?? "",
      dietary: guest.dietary ?? "",
      allergy_note: guest.allergyNote ?? "",
    })),
    p_cars: input.cars,
    p_bus_seats: input.busSeats,
    p_contact: input.contact ?? null,
    p_email: input.email ?? null,
  });
  if (error) throw error;
  return data as Created;
}

after(async () => {
  if (createdRefs.length === 0) return;
  await service.from("bookings").delete().in("ref", createdRefs);
});

test("bus_seats 5 on party 4 is rejected", async () => {
  const { data: student, error: studentError } = await service
    .from("students")
    .select("id")
    .eq("comp_seats", 2)
    .limit(1)
    .single();
  assert.equal(studentError, null, studentError?.message);
  assert.ok(student?.id);

  await assert.rejects(
    () =>
      createBooking({
        tableNo: TABLE_NO,
        partySize: 4,
        studentId: student.id,
        guests: [
          { name: "A", age: "18", dietary: "Chicken", allergyNote: "" },
          { name: "B", age: "17", dietary: "Fish", allergyNote: "" },
          { name: "C", age: "18", dietary: "Vegan", allergyNote: "" },
          { name: "D", age: "16", dietary: "Vegetarian", allergyNote: "" },
        ],
        cars: 0,
        busSeats: 5,
        contact: "555-0100",
        email: "reject@example.com",
      }),
    (err: Error) => /bus_seats exceeds party_size/i.test(err.message),
  );
});

test("full booking round-trips every field on bookings and guests", async () => {
  const { data: student, error: studentError } = await service
    .from("students")
    .select("id, comp_seats")
    .eq("comp_seats", 2)
    .limit(1)
    .single();
  assert.equal(studentError, null, studentError?.message);
  assert.ok(student?.id);

  await service.from("bookings").delete().eq("table_no", TABLE_NO);

  const guests = [
    {
      name: "Graduate One",
      age: "18",
      dietary: "Chicken",
      allergyNote: "Peanuts",
    },
    {
      name: "Guest Two",
      age: "47",
      dietary: "Vegetarian",
      allergyNote: "None",
    },
    {
      name: "Guest Three",
      age: "16",
      dietary: "Fish",
      allergyNote: "Shellfish",
    },
    {
      name: "Guest Four",
      age: "15",
      dietary: "Gluten-free",
      allergyNote: "",
    },
  ];

  const created = await createBooking({
    tableNo: TABLE_NO,
    partySize: 4,
    studentId: student.id,
    guests,
    cars: 2,
    busSeats: 3,
    contact: "+65 9000 1111",
    email: "roundtrip@example.com",
  });
  createdRefs.push(created.ref);

  assert.equal(created.amount, (4 - 2) * 218);
  assert.equal(created.status, "awaiting_payment");
  assert.match(created.ref, /^GALA-\d{4}$/);

  const { data: booking, error: bookingError } = await service
    .from("bookings")
    .select(
      "ref, status, table_no, party_size, student_id, amount, cars, bus_seats, contact, email",
    )
    .eq("ref", created.ref)
    .single();
  assert.equal(bookingError, null, bookingError?.message);
  assert.deepEqual(
    {
      ref: booking.ref,
      status: booking.status,
      table_no: booking.table_no,
      party_size: booking.party_size,
      student_id: booking.student_id,
      amount: booking.amount,
      cars: booking.cars,
      bus_seats: booking.bus_seats,
      contact: booking.contact,
      email: booking.email,
    },
    {
      ref: created.ref,
      status: "awaiting_payment",
      table_no: TABLE_NO,
      party_size: 4,
      student_id: student.id,
      amount: 436,
      cars: 2,
      bus_seats: 3,
      contact: "+65 9000 1111",
      email: "roundtrip@example.com",
    },
  );

  const { data: guestRows, error: guestError } = await service
    .from("guests")
    .select("name, age, dietary, allergy_note, sort_order")
    .eq("booking_id", created.id)
    .order("sort_order", { ascending: true });
  assert.equal(guestError, null, guestError?.message);
  assert.equal(guestRows?.length, 4);
  assert.deepEqual(
    guestRows.map((row) => ({
      name: row.name,
      age: row.age,
      dietary: row.dietary,
      allergy_note: row.allergy_note,
    })),
    guests.map((guest) => ({
      name: guest.name,
      age: guest.age,
      dietary: guest.dietary,
      allergy_note: guest.allergyNote || null,
    })),
  );
});
