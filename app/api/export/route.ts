import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { exportAll } from "@/lib/sheetExport";

function authorized(header: string | null): boolean {
  const secret = process.env.EXPORT_SECRET ?? "";
  const presented = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : "";
  if (!secret || !presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Repair button: rewrite both tabs from Supabase. POST with Bearer EXPORT_SECRET. */
export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const tabs = await exportAll();
    return NextResponse.json({
      ok: true,
      tabs: tabs.map((tab) => ({ title: tab.title, rows: tab.rows.length })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "export failed" },
      { status: 500 },
    );
  }
}
