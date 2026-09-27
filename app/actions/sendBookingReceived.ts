"use server";

import { sendBookingReceivedEmail } from "@/lib/adminMail";

export type BookingReceivedNotice = {
  email?: string | null;
  ref: string;
  tableNo: number;
  partySize: number;
  guests: string[];
};

/**
 * Auto-reply after create_booking. Missing email is a silent skip.
 * A send failure is logged and never thrown back to the booking.
 */
export async function notifyBookingReceived(
  input: BookingReceivedNotice,
): Promise<void> {
  const to = input.email?.trim() ?? "";
  if (!to) {
    console.info(
      `Booking ${input.ref} has no email — skipped booking-received auto-reply`,
    );
    return;
  }

  try {
    await sendBookingReceivedEmail({
      to,
      ref: input.ref,
      tableNo: input.tableNo,
      partySize: input.partySize,
      guests: input.guests,
    });
  } catch (error) {
    console.error(`Booking-received email failed for ${input.ref}`, error);
  }
}
