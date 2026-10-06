import { NextResponse } from "next/server";
import { resendTicket } from "@/lib/adminActions";
import { readRef, requireAdmin } from "@/lib/adminRequest";

export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const ref = await readRef(request);
    if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    const result = await resendTicket(ref);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not resend the ticket" },
      { status: 500 },
    );
  }
}
