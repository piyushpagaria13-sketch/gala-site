"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBookingDraft } from "@/lib/bookingDraft";

/**
 * Header CTA for the booking flow shell. Enabled when the current step
 * reports itself valid via the booking draft context.
 */
export function ContinueButton() {
  const { stepValid, goNext, step, resetDraft } = useBookingDraft();
  const router = useRouter();

  // The pay screen has no header CTA — "I've paid" sits below the QR card.
  if (step === "pay") return <span className="w-[44px]" aria-hidden />;

  // Confirmation screen: × on the right closes the flow (booking is done,
  // no confirmation needed) and returns to the homepage.
  if (step === "done") {
    return (
      <button
        type="button"
        aria-label="Close"
        onClick={() => {
          resetDraft();
          router.push("/");
        }}
      >
        <Image src="/book/icon-x.svg" alt="" width={44} height={44} />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!stepValid}
      onClick={goNext}
      className="rounded-pill bg-gold px-7 py-3 text-[16px] font-semibold text-[#241a06] transition-opacity disabled:opacity-[0.35]"
    >
      {step === "review" ? "Confirm & pay" : "Continue"}
    </button>
  );
}
