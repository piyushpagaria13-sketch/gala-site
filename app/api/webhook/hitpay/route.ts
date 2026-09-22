import { NextResponse } from "next/server";

export async function POST() {
  // TODO: HitPay payment webhook (may go unused).
  // A verified payment must call updateBookingStatus(ref, "paid") from
  // lib/bookingStatus.ts. That is the only status write, and it rewrites
  // the Sheet. A Sheet failure does not undo the status change.
  return NextResponse.json(
    { error: "HitPay webhook is not implemented yet" },
    { status: 501 },
  );
}
