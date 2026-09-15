import { NextResponse } from "next/server";

export async function POST() {
  // TODO: HitPay payment webhook (may go unused)
  // TODO: on success, set booking status to 'paid'
  return NextResponse.json(
    { error: "HitPay webhook is not implemented yet" },
    { status: 501 },
  );
}
