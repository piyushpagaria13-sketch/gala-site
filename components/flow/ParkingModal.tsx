"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui/Stepper";
import { useBookingDraft } from "@/lib/bookingDraft";

/**
 * "Car parking" dialog from the review screen — number of cars + a contact
 * number for the passes. Saved into the draft only; nothing hits Supabase
 * until Confirm & pay.
 */
export function ParkingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { draft, setDraft } = useBookingDraft();
  const [cars, setCars] = useState(Math.max(draft.cars, 1));
  const [phone, setPhone] = useState(draft.contact?.phone ?? "");

  if (!open) return null;

  const handleSave = () => {
    setDraft({
      ...draft,
      cars,
      contact: { ...draft.contact, phone: phone.trim() || undefined },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="parking-dialog-title"
    >
      <div
        className="w-full max-w-[460px] rounded-[24px] border-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-8 pb-7 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="parking-dialog-title"
          className="font-display text-[24px] font-medium text-[#e3c46a]"
        >
          Car parking
        </h2>
        <p className="mt-2 text-[15px] leading-[1.5] text-[#9a7f3e]">
          We&apos;ll arrange passes for your group.
        </p>

        <p className="mt-[22px] text-[12px] text-[#9a7f3e]">Number of cars</p>
        <div className="mt-[6px]">
          <Stepper value={cars} min={1} max={10} onChange={setCars} />
        </div>

        <div className="mt-[18px] flex flex-col gap-[6px]">
          <label className="text-[12px] text-[#9a7f3e]" htmlFor="parking-phone">
            Contact number
          </label>
          <input
            id="parking-phone"
            type="tel"
            value={phone}
            placeholder="+65 9123 4567"
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-[10px] border border-[#6e5a2b] bg-[#1a1610] px-[14px] py-3 text-[15px] text-[#e8d9a8] outline-none transition-colors placeholder:text-[#77633a] focus:border-gold"
          />
        </div>

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
