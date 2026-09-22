"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { COMP_MODAL_COPY } from "@/lib/config";

export function CompSeatsModal({
  open,
  onContinue,
}: {
  open: boolean;
  onContinue: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 px-4"
      onClick={onContinue}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comp-seats-dialog-title"
    >
      <div
        className="w-full max-w-[480px] rounded-card-lg border-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-8 pb-7 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="comp-seats-dialog-title"
          className="font-display text-[24px] font-medium text-[#e3c46a]"
        >
          {COMP_MODAL_COPY.title}
        </h2>
        <p className="mt-2 text-[15px] leading-[1.55] text-[#9a7f3e]">
          {COMP_MODAL_COPY.body}
        </p>
        <div className="mt-[26px] flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-[12px] bg-gold px-7 py-[13px] text-[16px] font-semibold text-[#241a06]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
