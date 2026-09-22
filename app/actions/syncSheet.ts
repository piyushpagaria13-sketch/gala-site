"use server";

import { syncSheetQuietly } from "@/lib/sheetExport";

/** Fire after a booking is saved. Failures stay inside syncSheetQuietly. */
export async function syncSheetAfterChange(): Promise<void> {
  await syncSheetQuietly();
}
