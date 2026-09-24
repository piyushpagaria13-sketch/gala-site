import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminRequest";
import { exportAll } from "@/lib/sheetExport";

/** Same rewrite as POST /api/export, gated by the admin session instead of the bearer secret. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const tabs = await exportAll();
    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      tabs: tabs.map((tab) => ({ title: tab.title, rows: tab.rows.length })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "export failed" },
      { status: 500 },
    );
  }
}
