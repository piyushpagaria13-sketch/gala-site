import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminGuard } from "@/lib/adminAuth";

export async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const blocked = adminGuard(jar.get(ADMIN_COOKIE)?.value);
  if (!blocked) return null;
  return NextResponse.json(blocked.body, { status: blocked.status });
}

export async function readRef(request: Request): Promise<string> {
  const body = (await request.json()) as { ref?: string };
  return body.ref?.trim() ?? "";
}
