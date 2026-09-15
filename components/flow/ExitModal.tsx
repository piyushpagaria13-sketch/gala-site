"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBookingDraft } from "@/lib/bookingDraft";

/**
 * Exit confirmation — Figma frame "D1c · Exit confirmation (dark)" (252:56).
 * The × in the flow header opens this dialog over the dimmed screen;
 * Cancel returns to the flow, Exit clears the draft and leaves to the
 * homepage.
 */

type ExitModalProps = {
  open: boolean;
  onCancel: () => void;
  onExit: () => void;
  title?: string;
  body?: string;
};

export function ExitModal({
  open,
  onCancel,
  onExit,
  title = "Exit this booking?",
  body = "Your session will restart and anything entered so far will be cleared.",
}: ExitModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
    >
      <div
        className="w-full max-w-[480px] rounded-card-lg border-[0.5px] border-[rgba(212,175,55,0.4)] bg-[#1c1710] px-8 pb-7 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="exit-dialog-title"
          className="font-display text-[24px] font-medium text-[#e3c46a]"
        >
          {title}
        </h2>
        <p className="mt-2 text-[15px] leading-[1.55] text-[#9a7f3e]">{body}</p>
        <div className="mt-[26px] flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[12px] border border-[#8a6f35] px-7 py-[13px] text-[16px] font-medium text-[#e8d9a8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-[12px] bg-gold px-7 py-[13px] text-[16px] font-semibold text-[#241a06]"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Header-left control: × (exit confirmation) on the first step,
 * back chevron on later steps — per the Figma flow frames.
 * On the table map, going back would drop the whole selection, so it asks
 * for confirmation first; confirming restarts the session at step 1.
 */
export function ExitButton() {
  const [open, setOpen] = useState(false);
  const { resetDraft, step, goBack } = useBookingDraft();
  const router = useRouter();

  const handleExit = () => {
    resetDraft();
    router.push("/");
  };

  // Confirmation screen: the × moves to the right (rendered by
  // ContinueButton) — keep the header balanced with a spacer here.
  if (step === "done") {
    return <span className="block h-[44px] w-[44px]" aria-hidden />;
  }

  if (step === "table") {
    return (
      <>
        <button type="button" aria-label="Back" onClick={() => setOpen(true)}>
          <Image src="/book/icon-back.svg" alt="" width={44} height={44} />
        </button>
        <ExitModal
          open={open}
          onCancel={() => setOpen(false)}
          onExit={() => {
            setOpen(false);
            resetDraft(); // returns the flow to the student step
          }}
          title="Are you sure you want to exit the session?"
          body="If you exit, you'll have to restart your booking from the beginning."
        />
      </>
    );
  }

  if (step !== "student") {
    return (
      <button type="button" aria-label="Back" onClick={goBack}>
        <Image src="/book/icon-back.svg" alt="" width={44} height={44} />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Exit booking"
        onClick={() => setOpen(true)}
      >
        <Image src="/book/icon-x.svg" alt="" width={44} height={44} />
      </button>
      <ExitModal
        open={open}
        onCancel={() => setOpen(false)}
        onExit={handleExit}
      />
    </>
  );
}
