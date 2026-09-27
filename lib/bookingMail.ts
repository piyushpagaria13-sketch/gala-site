/**
 * Sends the booking-received email from the confirmation page.
 * Delivery uses Resend when RESEND_API_KEY is set.
 */

import { sendBookingReceivedEmail } from "@/lib/adminMail";
import { bookingReceivedText } from "@/lib/bookingReceived";

export type BookingCopy = {
  to: string;
  ref: string;
  tableNo: number;
  partySize: number;
  guests: string[];
};

export function bookingCopyText(copy: BookingCopy): string {
  return bookingReceivedText({
    ref: copy.ref,
    tableNo: copy.tableNo,
    partySize: copy.partySize,
    guests: copy.guests,
  });
}

export async function deliverBookingCopy(copy: BookingCopy): Promise<void> {
  await sendBookingReceivedEmail({
    to: copy.to,
    ref: copy.ref,
    tableNo: copy.tableNo,
    partySize: copy.partySize,
    guests: copy.guests,
  });
}
