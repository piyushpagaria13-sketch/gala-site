"use server";

import { deliverBookingCopy } from "@/lib/bookingMail";
import { exportAll } from "@/lib/sheetExport";
import { getSupabaseServiceClient } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Save the address, send the booking copy, then mark the sheet Email column Sent.
 * The address is stored on the booking. The sheet only shows "Sent".
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
    .select("id, ref, table_no")
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

  await deliverBookingCopy({
    to: trimmed,
    ref: booking.ref,
    tableNo: booking.table_no,
    guests: (guests ?? []).map((guest) => guest.name),
  });

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ email: trimmed })
    .eq("ref", ref);

  if (updateError) throw updateError;
  await exportAll();
}
