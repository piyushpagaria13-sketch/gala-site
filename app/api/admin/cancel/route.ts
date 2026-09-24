import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/adminActions";
import { readRef, requireAdmin } from "@/lib/adminRequest";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const ref = await readRef(request);
    if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    const result = await cancelBooking(ref);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not cancel that booking" },
      { status: 500 },
    );
  }
}
