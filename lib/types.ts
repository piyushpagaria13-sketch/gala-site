export type BookingStatus =
  | "awaiting_payment"
  | "claims_paid"
  | "paid"
  | "cancelled";

export type Student = {
  id: string;
  /** Display name — preferred_name + " " + family_name when present. */
  name: string;
  grade?: string;
  compSeats: number;
  preferredName?: string;
  officialName?: string;
  familyName?: string;
};

export type Guest = {
  name: string;
  age?: string;
  /** Mother/Father, sibling, alumni, or other. Guest cards only. */
  title?: string;
  dietary?: string;
  allergyNote?: string;
  /** Table bookings can include extra graduates. The first student cannot be removed. */
  kind?: "student" | "guest";
};

export type Booking = {
  id: string;
  ref: string; // GALA-NNNN
  status: BookingStatus;
  tableNo: number;
  partySize: number;
  student?: Student;
  guests?: Guest[];
  cars?: number;
  busSeats?: number;
  contact?: string;
  email?: string;
  amount?: number;
};
