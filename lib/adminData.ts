import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AdminBooking, AdminGuest, AdminStatus } from "@/lib/adminRules";

type StudentJoin = {
  name: string | null;
  preferred_name: string | null;
  family_name: string | null;
  comp_seats: number | null;
};

type GuestJoin = {
  name: string | null;
  age: string | null;
  dietary: string | null;
  allergy_note: string | null;
  sort_order: number | null;
};

type BookingJoin = {
  id: string;
  ref: string;
  status: AdminStatus;
  table_no: number;
  party_size: number;
  cars: number;
  bus_seats: number;
  contact: string | null;
  email: string | null;
  amount: number;
  created_at: string;
  ticket_sent_at: string | null;
  reminder_sent_at: string | null;
  cancelled_at: string | null;
  students: StudentJoin | StudentJoin[] | null;
  guests: GuestJoin[] | null;
};

function oneStudent(value: BookingJoin["students"]): StudentJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function studentName(student: StudentJoin | null, guests: AdminGuest[]): string {
  if (student) {
    const display = [student.preferred_name, student.family_name]
      .filter(Boolean)
      .join(" ");
    if (display) return display;
    if (student.name) return student.name;
  }
  return guests[0]?.name ?? "";
}

export function mapBooking(row: BookingJoin): AdminBooking {
  const guests: AdminGuest[] = (row.guests ?? []).map((guest) => ({
    name: guest.name ?? "",
    age: guest.age ?? "",
    dietary: guest.dietary ?? "",
    allergyNote: guest.allergy_note ?? "",
    sortOrder: guest.sort_order ?? 0,
  }));
  const student = oneStudent(row.students);
  return {
    id: row.id,
    ref: row.ref,
    status: row.status,
    tableNo: row.table_no,
    partySize: row.party_size,
    cars: row.cars,
    busSeats: row.bus_seats,
    contact: row.contact ?? "",
    email: row.email ?? "",
    amount: row.amount,
    createdAt: row.created_at,
    ticketSentAt: row.ticket_sent_at,
    reminderSentAt: row.reminder_sent_at,
    cancelledAt: row.cancelled_at,
    studentName: studentName(student, guests),
    compSeats: student?.comp_seats ?? 0,
    guests,
  };
}

const BOOKING_SELECT =
  "id, ref, status, table_no, party_size, cars, bus_seats, contact, email, amount, created_at, ticket_sent_at, reminder_sent_at, cancelled_at, students(name, preferred_name, family_name, comp_seats), guests(name, age, dietary, allergy_note, sort_order)";

export async function loadAdminBookings(): Promise<AdminBooking[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as BookingJoin[]).map(mapBooking);
}

export async function loadAdminBooking(ref: string): Promise<AdminBooking | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("ref", ref)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBooking(data as unknown as BookingJoin);
}
