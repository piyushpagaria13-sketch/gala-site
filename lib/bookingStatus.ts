import { syncSheetQuietly } from "./sheetExport";
import { getSupabaseServiceClient } from "./supabase";
import type { BookingStatus } from "./types";

/**
 * The only status write. Rewrites the Sheet afterwards; a Sheet failure
 * does not undo the status change.
 */
export async function updateBookingStatus(
  ref: string,
  status: BookingStatus,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("ref", ref);
  if (error) throw error;
  await syncSheetQuietly();
}
