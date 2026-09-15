export type BookingStatus =
  | "awaiting_payment"
  | "claims_paid"
  | "paid"
  | "cancelled";

export type Student = {
  id: string;
  name: string;
  grade?: string;
  // TODO: match columns on the students table
};

export type Guest = {
  name: string;
  age?: string;
  dietary?: string;
  allergyNote?: string;
};

export type Booking = {
  id: string;
  ref: string; // GALA-NNNN
  status: BookingStatus;
  tableNo: number;
  partySize: number;
  student?: Student;
  guests?: Guest[];
  // TODO: remaining booking columns (cars, busSeats, contact, created_at)
};
