import { NextResponse } from "next/server";

export async function POST() {
  // TODO: call create_booking RPC (row lock, derived remaining seats, GALA-NNNN)
  // RULE: nothing is written to Supabase until Confirm & pay.
  //
  // Commit-time backstop contract: when the RPC rejects because the table
  // filled up (remaining < party_size inside its lock), respond with
  // { error: "capacity", tableNo } and 409. The client (Confirm & pay step)
  // must then bounce back to the table map, refetch all counts, and toast
  // commitRejectionMessage() from lib/seatMath.ts:
  // "The table is at full capacity. Please try to book some other table."
  return NextResponse.json(
    { error: "create_booking is not implemented yet" },
    { status: 501 },
  );
}
