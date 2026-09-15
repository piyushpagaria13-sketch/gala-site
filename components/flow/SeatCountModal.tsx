"use client";

import { useState } from "react";
import { useBookingDraft } from "@/lib/bookingDraft";

/**
 * "How many seats?" — Figma frame "D2c · Seat count modal (dark)" (253:85).
 * Opens when Continue is pressed on the booking-type step with "Book seats"
 * selected. Confirm stores the party size in the draft.
 */
export function SeatCountModal() {
  const { draft, setDraft, seatCountOpen, setSeatCountOpen, goToStep } =
    useBookingDraft();
  const [count, setCount] = useState<number | null>(draft.partySize);

  if (!seatCountOpen) return null;

  const handleCancel = () => setSeatCountOpen(false);

  const handleConfirm = () => {
    if (count === null) return;
    setDraft({ ...draft, partySize: count });
    setSeatCountOpen(false);
    goToStep("table");
  };

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-4 sm:rounded-card-lg"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="seat-count-title"
    >
      <div
        className="w-full max-w-[520px] rounded-card-lg border-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-8 pb-7 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="seat-count-title"
          className="font-display text-[24px] font-medium text-[#e3c46a]"
        >
          How many seats?
        </h2>
        <p className="mt-2 text-[15px] leading-[1.5] text-[#9a7f3e]">
          You&apos;ll join a table with other guests. Include the graduate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = count === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={selected}
                onClick={() => setCount(n)}
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-pill text-[17px] transition-colors ${
                  selected
                    ? "bg-gold font-semibold text-[#241a06]"
                    : "border-[1.5px] border-[#6e5a2b] text-[#d9bd6f]"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-[12px] border border-[#8a6f35] px-7 py-[13px] text-[16px] font-medium text-[#e8d9a8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={count === null}
            className="rounded-[12px] bg-gold px-7 py-[13px] text-[16px] font-semibold text-[#241a06] transition-opacity disabled:opacity-[0.35]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
