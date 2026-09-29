import { TABLE_FULL_MESSAGE } from "./seatMath";
import { NAME_ALREADY_BOOKED_MESSAGE } from "./studentBooking";
import { studentHasLiveBooking } from "./students";
import { getSupabaseClient } from "./supabase";
import type { BookingStatus, Guest } from "@/lib/types";

export type CreateBookingInput = {
  tableNo: number;
  partySize: number;
  studentId: string | null;
  guests: Guest[];
  cars: number;
  busSeats: number;
  contact?: string | null;
  email?: string | null;
};

export type CreatedBooking = {
  id: string;
  ref: string;
  amount: number;
  status: BookingStatus;
};

type CreateBookingRow = {
  id: string;
  ref: string;
  amount: number;
  status: BookingStatus;
};

export class BookingCapacityError extends Error {
  tableNo: number;
  constructor(tableNo: number) {
    super(TABLE_FULL_MESSAGE);
    this.name = "BookingCapacityError";
    this.tableNo = tableNo;
  }
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreatedBooking> {
  if (input.studentId && (await studentHasLiveBooking(input.studentId))) {
    throw new Error(NAME_ALREADY_BOOKED_MESSAGE);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_table_no: input.tableNo,
    p_party_size: input.partySize,
    p_student_id: input.studentId,
    p_guests: input.guests.map((guest) => ({
      name: guest.name,
      age: guest.age ?? "",
      dietary: guest.dietary ?? "",
      allergy_note: guest.allergyNote ?? "",
      title: guest.title ?? "",
      graduating_student: guest.graduatingStudent ?? "",
    })),
    p_cars: input.cars,
    p_bus_seats: input.busSeats,
    p_contact: input.contact ?? null,
    p_email: input.email ?? null,
  });

  if (error) {
    const capacity = error.message.match(/capacity:(\d+)/);
    if (capacity) {
      throw new BookingCapacityError(Number(capacity[1]));
    }
    if (/name_already_booked/i.test(error.message)) {
      throw new Error(NAME_ALREADY_BOOKED_MESSAGE);
    }
    throw error;
  }

  const row = data as CreateBookingRow;
  return {
    id: row.id,
    ref: row.ref,
    amount: row.amount,
    status: row.status,
  };
}

/** The only client-reachable post-commit update — email, matched by booking ref. */
export async function updateBookingEmail(
  ref: string,
  email: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("bookings")
    .update({ email })
    .eq("ref", ref);

  if (error) throw error;
}
