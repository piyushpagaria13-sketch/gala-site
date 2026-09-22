"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui/Stepper";
import { partySeatCount, useBookingDraft } from "@/lib/bookingDraft";

/**
 * Quantity dialog shared by car parking and the shuttle bus. The count is
 * capped at one per guest and saved into the draft only — nothing hits
 * Supabase until Confirm & pay.
 */
export function CountModal({
  open,
  onClose,
  titleId,
  title,
  description,
  fieldLabel,
  saved,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  description: string;
  fieldLabel: string;
  saved: number;
  onSave: (count: number) => void;
}) {
  const { draft } = useBookingDraft();
  const maxSeats = partySeatCount(draft);
  const [count, setCount] = useState(Math.min(Math.max(saved, 1), maxSeats));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="w-full max-w-[460px] rounded-[24px] border-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-8 pb-7 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="font-display text-[24px] font-medium text-[#e3c46a]"
        >
          {title}
        </h2>
        <p className="mt-2 text-[15px] leading-[1.5] text-[#9a7f3e]">
          {description}
        </p>

        <p className="mt-[22px] text-[12px] text-[#9a7f3e]">{fieldLabel}</p>
        <div className="mt-[6px]">
          <Stepper value={count} min={1} max={maxSeats} onChange={setCount} />
        </div>
        <p className="mt-2 text-[12px] text-[#77633a]">
          Up to {maxSeats} — one per guest
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
            onClick={() => {
              onSave(count);
              onClose();
            }}
            className="rounded-[12px] bg-gold px-7 py-[13px] text-[16px] font-semibold text-[#241a06]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Shuttle bus" dialog from the review screen. */
export function BusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { draft, setDraft } = useBookingDraft();

  return (
    <CountModal
      open={open}
      onClose={onClose}
      titleId="bus-dialog-title"
      title="Shuttle bus"
      description="Runs between Dover campus and the ballroom before and after the gala."
      fieldLabel="Bus seats"
      saved={draft.busSeats}
      onSave={(busSeats) => setDraft({ ...draft, busSeats })}
    />
  );
}
