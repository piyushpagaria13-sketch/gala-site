"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { SHOW_PAYNOW_QR } from "@/lib/bookingReceived";
import { partySeatCount, useBookingDraft } from "@/lib/bookingDraft";
import { bookingTotal } from "@/lib/pricing";

/**
 * "Pay using PayNow" — shown after Confirm & pay when there is a payable
 * total. PayNow QR, amount, GALA reference, then "I've paid".
 */
export function PayNowScreen() {
  const { draft, goNext } = useBookingDraft();

  const seats = partySeatCount(draft);
  const comps = draft.student?.compSeats ?? 0;
  const total = draft.amount ?? bookingTotal(seats, comps);
  const ref = draft.bookingRef ?? "GALA27";

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center px-4 pb-3 pt-1">
      <h1 className="mt-3 shrink-0 text-center font-display text-[30px] font-medium leading-none text-[#e3c46a]">
        Pay using PayNow
      </h1>
      <p className="mt-3 max-w-[480px] shrink-0 text-center text-[15px] leading-[1.45] text-[#e8d9a8]">
        Payments must come from the parent of a graduating student. This is for
        governance purposes
      </p>

      <PayNote className="mt-3 max-w-[480px] shrink-0">
        <span className="text-[21px] font-bold leading-[1.3]">
          Don&apos;t forget to take a screenshot of your payment
        </span>
      </PayNote>

      <div className="mt-6 flex w-full max-w-[480px] flex-col items-center rounded-card border border-[#6e5a2b] bg-[#1a1610] px-7 py-4">
        {SHOW_PAYNOW_QR ? (
          <>
            <p className="shrink-0 text-[15px] text-[#e8d9a8]">
              Scan this QR code with your banking app
            </p>
            <div className="mt-3 flex w-full items-center justify-center">
              <div className="relative h-[200px] w-[200px] overflow-clip rounded-[12px] bg-white">
                <Image
                  src="/book/paynow-qr.png"
                  alt="PayNow QR code"
                  width={300}
                  height={300}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </>
        ) : null}

        <p className={`${SHOW_PAYNOW_QR ? "mt-3" : ""} shrink-0 text-[13px] text-[#9a7f3e]`}>
          Amount
        </p>
        <p className="mt-0.5 shrink-0 font-display text-[34px] font-medium leading-none text-[#e3c46a]">
          S${total}.00
        </p>

        <PayNote className="mt-3 shrink-0">
          Add {ref} as the reference so we can match your payment.
        </PayNote>
      </div>

      <button
        type="button"
        onClick={() => goNext()}
        className="mt-3 w-full max-w-[480px] shrink-0 rounded-pill bg-gold py-3.5 text-[16px] font-semibold text-[#241a06]"
      >
        I&apos;ve paid
      </button>
    </div>
  );
}

/**
 * Deterministic QR-look placeholder: 25×25 grid of 8px modules matching the
 * design mock. Not scannable — replaced by the real PayNow QR later.
 */
function PayNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full gap-3 rounded-[12px] border-[0.5px] border-[#3a2f18] bg-[#100d07] px-4 py-[13px] ${className}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[12px] bg-[#e5b52a] text-[14px] font-bold text-[#241a06]">
        !
      </span>
      <p className="text-[14px] leading-[1.5] text-[#9a7f3e]">{children}</p>
    </div>
  );
}
