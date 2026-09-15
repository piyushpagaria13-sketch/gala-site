"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TablePopover } from "@/components/flow/TablePopover";
import { useBookingDraft } from "@/lib/bookingDraft";
import {
  CANVAS,
  DANCE_FLOOR,
  FLOORPLAN,
  ROOM_OUTLINE,
  TABLE_CAPACITY,
  type FloorTable,
} from "@/lib/floorplan";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Step 3 — table map. Renders the ballroom from lib/floorplan.ts (data-driven:
 * swap the coordinates there to redraw the room without touching this file).
 *
 * Table states are always derived, never stored:
 *   remaining = 10 − Σ party_size of non-cancelled bookings for that table.
 * Blocked tables come from the `tables` table. Nothing is written to Supabase
 * on this screen — commit-time validation lives in the create_booking RPC.
 */

type FloorData = {
  /** table_no → booked seat count. */
  booked: Map<number, number>;
  blocked: Set<number>;
};

type TableState = "selected" | "available" | "soldout" | "blocked" | "unknown";

// Popover geometry (px, matches TablePopover's sm: width).
const POP_W = 272;
const POP_H = 236;
const POP_GAP = 32;
const POP_MARGIN = 8;

export function TableMap() {
  const { draft, setDraft, setStepValid } = useBookingDraft();
  const [data, setData] = useState<FloorData | null>(null);
  const [popover, setPopover] = useState<{
    table: FloorTable;
    left: number;
    top: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const [bookingsRes, tablesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("table_no, party_size")
          .neq("status", "cancelled"),
        supabase.from("tables").select("table_no").eq("blocked", true),
      ]);
      if (bookingsRes.error || tablesRes.error) {
        throw bookingsRes.error ?? tablesRes.error;
      }
      const booked = new Map<number, number>();
      for (const row of (bookingsRes.data ?? []) as {
        table_no: number;
        party_size: number;
      }[]) {
        booked.set(row.table_no, (booked.get(row.table_no) ?? 0) + row.party_size);
      }
      const blocked = new Set(
        ((tablesRes.data ?? []) as { table_no: number }[]).map(
          (row) => row.table_no,
        ),
      );
      setData({ booked, blocked });
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Whole-table bookings claim all seats regardless of any earlier seat count.
  const partySize =
    draft.type === "table"
      ? TABLE_CAPACITY
      : (draft.partySize ?? TABLE_CAPACITY);
  const studentName = draft.student?.name ?? "";

  const stateOf = (tableNo: number): TableState => {
    if (draft.tableNo === tableNo) return "selected";
    if (data === null) return "unknown"; // fetch failed: ring, no counts
    if (data.blocked.has(tableNo)) return "blocked";
    const remaining = TABLE_CAPACITY - (data.booked.get(tableNo) ?? 0);
    return remaining >= 1 ? "available" : "soldout";
  };

  const fullyBooked =
    data !== null &&
    FLOORPLAN.every(
      (t) =>
        data.blocked.has(t.tableNo) ||
        (data.booked.get(t.tableNo) ?? 0) >= TABLE_CAPACITY,
    );

  const openPopover = (table: FloorTable) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const w = rect?.width ?? 800;
    const h = rect?.height ?? w / 2;
    const px = (table.x / 100) * w;
    const py = (table.y / 100) * h;
    const left = Math.min(
      Math.max(px - POP_W / 2, POP_MARGIN),
      w - POP_W - POP_MARGIN,
    );
    // Below the table by default; flip above if it would overflow the bottom.
    let top = py + POP_GAP;
    if (top + POP_H > h - POP_MARGIN) top = py - POP_H - POP_GAP;
    top = Math.max(top, POP_MARGIN);
    setPopover({ table, left, top });
  };

  const handleChoose = (tableNo: number) => {
    setDraft({ ...draft, tableNo });
    setStepValid(true);
    setPopover(null);
  };

  const handleLeave = () => {
    setDraft({ ...draft, tableNo: null });
    setStepValid(false);
    setPopover(null);
  };

  return (
    <div className="flex w-full flex-col items-center px-4 pt-10 sm:px-6">
      <p className="text-center text-[13px] font-medium uppercase tracking-[2.34px] text-[#9a7f3e]">
        {draft.type === "table" ? "BOOK A TABLE" : "BOOK SEATS"}
      </p>
      <h1 className="mt-3 text-center font-display text-[28px] font-medium text-[#e3c46a] sm:text-[32px]">
        Choose your table
      </h1>
      {fullyBooked ? (
        <p className="mt-3 rounded-[8px] border border-[rgba(224,147,125,0.35)] bg-[rgba(224,147,125,0.08)] px-3 py-[10px] text-center text-[12px] leading-[1.5] text-[#e0937d]">
          The ballroom is fully booked — contact your Grade Rep for the
          waitlist.
        </p>
      ) : (
        <p className="mt-2 text-center text-[14px] text-[#9a7f3e]">
          Tap any open table to see space for your party of {partySize}.
        </p>
      )}

      <div className="mt-6 w-full overflow-x-auto pb-4">
        <div
          ref={canvasRef}
          className="relative mx-auto aspect-[1024/580] w-full min-w-[700px] max-w-[744px]"
        >
          {/* Hexagonal room outline (traced from the venue plan) */}
          <svg
            viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <polygon
              points={ROOM_OUTLINE}
              fill="none"
              stroke="#3a2f18"
              strokeWidth="2"
            />
          </svg>

          {/* Dance floor */}
          <div
            className="absolute flex items-center justify-center gap-[6px] rounded-[10px] border border-[#3a2f18] bg-[#1a1610] p-6"
            style={{
              left: `${DANCE_FLOOR.x}%`,
              top: `${DANCE_FLOOR.y}%`,
              width: `${DANCE_FLOOR.width}%`,
              height: `${DANCE_FLOOR.height}%`,
            }}
          >
            <span
              className="max-h-full text-[8px] font-medium tracking-[0.5px] text-[#5d4c2b]"
              style={{ writingMode: "vertical-rl" }}
            >
              DANCE FLOOR
            </span>
            <span
              className="max-h-full text-[8px] font-medium tracking-[0.5px] text-[#5d4c2b]"
              style={{ writingMode: "vertical-rl" }}
            >
              24FT × 30FT
            </span>
          </div>

          {FLOORPLAN.map((table) => {
            const state = stateOf(table.tableNo);
            const clickable =
              state === "available" ||
              state === "unknown" ||
              state === "selected";

            const styles: Record<TableState, string> = {
              available:
                "cursor-pointer border-[1.5px] border-[#c9932c] text-[#c9a648] transition-transform hover:scale-[1.15] hover:shadow-[0_0_16px_rgba(212,175,55,0.4)]",
              unknown:
                "cursor-pointer border-[1.5px] border-[#c9932c] text-[#c9a648] transition-transform hover:scale-[1.15] hover:shadow-[0_0_16px_rgba(212,175,55,0.4)]",
              soldout: "border border-[#3a2f18] bg-[#241e12] text-[#5d4c2b]",
              blocked:
                "border-[1.5px] border-dashed border-[#4a3c1d] text-[#4a3c1d]",
              selected:
                "scale-[1.12] bg-gold font-semibold text-[#241a06] shadow-[0_0_18px_rgba(212,175,55,0.5)]",
            };

            return (
              <button
                key={table.tableNo}
                type="button"
                disabled={!clickable}
                onClick={() => openPopover(table)}
                aria-label={`Table ${table.tableNo}`}
                className={`absolute flex h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill text-[11px] ${styles[state]}`}
                style={{ left: `${table.x}%`, top: `${table.y}%` }}
              >
                {table.tableNo}
              </button>
            );
          })}

          {popover && (
            <TablePopover
              tableNo={popover.table.tableNo}
              partySize={partySize}
              initialBooked={
                data?.booked.get(popover.table.tableNo) ??
                (data ? 0 : null)
              }
              selected={draft.tableNo === popover.table.tableNo}
              ctaLabel={
                draft.type === "table"
                  ? "Reserve this table"
                  : "Choose this table"
              }
              anchor={{ left: popover.left, top: popover.top }}
              onClose={() => setPopover(null)}
              onChoose={handleChoose}
              onLeave={handleLeave}
            />
          )}
        </div>
      </div>

      {/* Screen-reader context; visual breadcrumb lives in the flow header. */}
      <p className="sr-only">
        Booking for {studentName}, party of {partySize}
      </p>
    </div>
  );
}
