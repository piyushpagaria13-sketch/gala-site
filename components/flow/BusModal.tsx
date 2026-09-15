"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui/Stepper";
import { useBookingDraft } from "@/lib/bookingDraft";
import { TABLE_CAPACITY } from "@/lib/floorplan";

/**
 * "Shuttle bus" dialog from the review screen — bus seats capped at one per
 * guest in the booking. Saved into the draft only; nothing hits Supabase
 * until Confirm & pay.
 */
export function BusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { draft, setDraft } = useBookingDraft();

  const maxSeats =
    draft.type === "table"
      ? TABLE_CAPACITY
      : (draft.partySize ?? TABLE_CAPACITY);
  const [seats, setSeats] = useState(
    Math.min(Math.max(draft.busSeats, 1), maxSeats),
  );

  if (!open) return null;

  const handleSave = () => {
    setDraft({ ...draft, busSeats: seats });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bus-dialog-title"
    >
      <div
        className="w-full max-w-[460px] rounded-[24px] border-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-8 pb-7 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="bus-dialog-title"
          className="font-display text-[24px] font-medium text-[#e3c46a]"
        >
          Shuttle bus
        </h2>
        <p className="mt-2 text-[15px] leading-[1.5] text-[#9a7f3e]">
          Runs between Dover campus and the ballroom before and after the gala.
        </p>

        <p className="mt-[22px] text-[12px] text-[#9a7f3e]">Bus seats</p>
        <div className="mt-[6px]">
          <Stepper value={seats} min={1} max={maxSeats} onChange={setSeats} />
        </div>
        <p className="mt-2 text-[12px] text-[#77633a]">
          Up to {maxSeats} — one per guest in your booking.
        </p>

        <div className="mt-[26px] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] border border-[#8a6f35] px-7 py-[13px] text-[16px] font-medium text-[#e8d9a8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-[12px] bg-gold px-7 py-[13px] text-[16px] font-semibold text-[#241a06]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
