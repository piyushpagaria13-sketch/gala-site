"use server";

import { sendBookingReceivedEmail } from "@/lib/adminMail";
import { exportAll } from "@/lib/sheetExport";
import { getSupabaseServiceClient } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Save the address, send the booking-received note, then rewrite the sheet
 * so the Email column shows the address from the first booking page.
 */
export async function sendBookingCopy(
  ref: string,
  email: string,
): Promise<void> {
  const trimmed = email.trim();
  if (!ref || !EMAIL_PATTERN.test(trimmed)) {
    throw new Error("Add a valid email address");
  }

  const supabase = getSupabaseServiceClient();
  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("id, ref, table_no, party_size")
    .eq("ref", ref)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!booking) throw new Error("Couldn't find that booking");

  const { data: guests, error: guestError } = await supabase
    .from("guests")
    .select("name, sort_order")
    .eq("booking_id", booking.id)
    .order("sort_order");

  if (guestError) throw guestError;

  await sendBookingReceivedEmail({
    to: trimmed,
    ref: booking.ref,
    tableNo: booking.table_no,
    partySize: booking.party_size,
    guests: (guests ?? []).map((guest) => guest.name),
  });

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ email: trimmed })
    .eq("ref", ref);

  if (updateError) throw updateError;
  await exportAll();
}
