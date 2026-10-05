import { NextResponse } from "next/server";
import { clearAllBookings } from "@/lib/adminActions";
import { requireAdmin } from "@/lib/adminRequest";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const result = await clearAllBookings();
    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      exportError: result.exportError,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not clear bookings",
      },
      { status: 500 },
    );
  }
}
