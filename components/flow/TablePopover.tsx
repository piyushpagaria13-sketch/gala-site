"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { TABLE_CAPACITY } from "@/lib/floorplan";
import { canSelect, derive, dotRow } from "@/lib/seatMath";

/**
 * Availability popover for a single table on the map. Anchored near the
 * table on ≥640px screens (clamped inside the map, flipped above when it
 * would overflow the bottom); a slide-up bottom sheet on mobile.
 *
 * Counts are refetched live every time the popover opens — page-load data
 * is only a fallback. The "Choose this table" button is never pre-disabled:
 * the too-small error appears on attempt, per the design.
 */

type TablePopoverProps = {
  tableNo: number;
  partySize: number;
  /** Booked seats from the page-load fetch; null when unknown. */
  initialBooked: number | null;
  /** True when this table is the user's current selection. */
  selected: boolean;
  /** Primary CTA label — "Choose this table" (seats) or "Reserve this table" (whole table). */
  ctaLabel: string;
  /** Anchor position (px, relative to the map canvas), pre-clamped/flipped. */
  anchor: { left: number; top: number };
  onClose: () => void;
  onChoose: (tableNo: number) => void;
  /** Deselect the current table (shown as "Leave this table"). */
  onLeave: () => void;
};

type LiveCount =
  | { state: "loading" }
  | { state: "known"; booked: number }
  | { state: "unknown" }; // live fetch failed and no fallback data

export function TablePopover({
  tableNo,
  partySize,
  initialBooked,
  selected,
  ctaLabel,
  anchor,
  onClose,
  onChoose,
  onLeave,
}: TablePopoverProps) {
  const [live, setLive] = useState<LiveCount>({ state: "loading" });
  const [attemptError, setAttemptError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLive({ state: "loading" });
    // Error clears whenever another table is opened (and on unmount/close).
    setAttemptError(null);

    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("bookings")
          .select("party_size")
          .eq("table_no", tableNo)
          .neq("status", "cancelled");
        if (error) throw error;
        if (!active) return;
        const { filled } = derive(
          ((data ?? []) as { party_size: number }[]).map(
            (row) => row.party_size,
          ),
        );
        setLive({ state: "known", booked: filled });
      } catch {
        if (!active) return;
        // Live refetch failed — fall back to the page-load count if we
        // have one, otherwise show the loading/unknown state.
        setLive(
          initialBooked !== null
            ? { state: "known", booked: initialBooked }
            : { state: "unknown" },
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [tableNo, initialBooked]);

  const booked = live.state === "known" ? live.booked : null;
  const remaining = booked !== null ? TABLE_CAPACITY - booked : null;
  const justSoldOut = !selected && remaining !== null && remaining <= 0;

  // Selection preview — purely client-side, this user only. The user's own
  // uncommitted party is NEVER added into fetched counts; the shared derived
  // count other users see is unchanged until Confirm & pay commits rows.
  const shown = selected
    ? Math.min((booked ?? 0) + partySize, TABLE_CAPACITY)
    : booked;
  const dots = dotRow(booked ?? 0, selected ? partySize : 0);

  const handleChoose = () => {
    // The check runs only on click — every available table opens regardless
    // of fit, and the button is never pre-disabled.
    if (remaining !== null) {
      const result = canSelect(remaining, partySize);
      if (!result.ok) {
        setAttemptError(result.error);
        return;
      }
    }
    // Unknown counts fall through — commit-time validation in the
    // create_booking RPC catches stale/oversized selections.
    onChoose(tableNo);
  };

  return (
    <>
      {/* Click-away layer */}
      <div
        className="fixed inset-0 z-20 bg-black/40 sm:bg-transparent"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-label={`Table ${tableNo} availability`}
        style={
          {
            "--pop-left": `${anchor.left}px`,
            "--pop-top": `${anchor.top}px`,
          } as CSSProperties
        }
        className="fixed inset-x-0 bottom-0 z-30 animate-[sheet-up_0.22s_ease-out] rounded-t-card-lg border-t-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-6 pb-8 pt-6 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-[var(--pop-left)] sm:top-[var(--pop-top)] sm:w-[272px] sm:animate-none sm:rounded-card sm:border-[0.5px] sm:px-5 sm:pb-5 sm:pt-5 sm:shadow-[0px_12px_36px_0px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[22px] font-medium text-[#e3c46a]">
            Table {tableNo}
          </h3>
          <span className="shrink-0 text-[13px] text-[#9a7f3e]">
            {shown !== null ? shown : "—"} out of {TABLE_CAPACITY}
          </span>
        </div>

        {selected && (
          <p className="mt-1 text-[13px] text-[#9a7f3e]">
            {shown ?? 0} of {TABLE_CAPACITY} filled · your {partySize}{" "}
            {partySize === 1 ? "seat" : "seats"} selected
          </p>
        )}

        <div className="mt-3 flex gap-[6px]">
          {dots.map((dot, i) => (
            <span
              key={i}
              className={`h-[14px] w-[14px] rounded-pill ${
                dot === "solid"
                  ? "bg-gold"
                  : dot === "selected"
                    ? "border-[1.2px] border-gold bg-[rgba(212,175,55,0.4)]"
                    : "border-[1.2px] border-[#6e5a2b]"
              }`}
            />
          ))}
        </div>

        {justSoldOut ? (
          <p className="mt-4 w-full rounded-[8px] border border-[rgba(224,147,125,0.35)] bg-[rgba(224,147,125,0.08)] px-3 py-[10px] text-[12px] leading-[1.5] text-[#e0937d]">
            This table just sold out.
          </p>
        ) : selected ? (
          <button
            type="button"
            onClick={onLeave}
            className="mt-4 w-full rounded-[12px] border border-[#8a6f35] px-6 py-[13px] text-[15px] font-semibold text-[#e8d9a8]"
          >
            Leave this table
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleChoose}
              className={`mt-4 w-full rounded-[12px] bg-gold px-6 py-[13px] text-[15px] font-semibold text-[#241a06] transition-opacity ${
                attemptError ? "opacity-50" : ""
              }`}
            >
              {ctaLabel}
            </button>
            {attemptError !== null && (
              <p className="mt-[10px] w-full rounded-[8px] border border-[rgba(224,147,125,0.35)] bg-[rgba(224,147,125,0.08)] px-3 py-[10px] text-[12px] leading-[1.5] text-[#e0937d]">
                {attemptError}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
