export type BookingStatus =
  | "awaiting_payment"
  | "claims_paid"
  | "paid"
  | "cancelled";

export type Student = {
  id: string;
  name: string;
  grade?: string;
  compSeats: number;
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
  cars?: number;
  busSeats?: number;
  contact?: string;
  email?: string;
  amount?: number;
};
