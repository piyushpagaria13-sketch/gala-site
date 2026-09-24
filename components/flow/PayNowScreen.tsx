"use client";

import type { ReactNode } from "react";
import { partySeatCount, useBookingDraft } from "@/lib/bookingDraft";
import { bookingTotal } from "@/lib/pricing";

/**
 * "Pay using PayNow" — shown after Confirm & pay when there is a payable
 * total. QR card with the amount and the GALA reference, then "I've paid".
 */
export function PayNowScreen() {
  const { draft, goNext } = useBookingDraft();

  const seats = partySeatCount(draft);
  const comps = draft.student?.compSeats ?? 0;
  const total = draft.amount ?? bookingTotal(seats, comps);
  const ref = draft.bookingRef ?? "GALA27";

  return (
    <div className="flex w-full flex-col items-center px-4 pb-8 pt-5">
      <h1 className="text-center font-display text-[30px] font-medium text-[#e3c46a]">
        Pay using PayNow
      </h1>

      <div className="mt-[22px] flex w-full max-w-[480px] flex-col items-center rounded-card border border-[#6e5a2b] bg-[#1a1610] px-7 pb-7 pt-[26px]">
        <p className="text-[15px] text-[#e8d9a8]">
          Scan this QR code with your banking app
        </p>

        <div className="relative mt-[18px] h-[224px] w-[224px] overflow-clip rounded-[12px] bg-[#fffdf8]">
          <PlaceholderQr />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#fffdf8] px-2 py-1 text-center text-[16px] font-bold leading-[normal] tracking-[0.64px] text-[#7b1f8a]">
              PAY
              <br />
              NOW
            </div>
          </div>
        </div>

        <p className="mt-[18px] text-[13px] text-[#9a7f3e]">Amount</p>
        <p className="mt-[2px] font-display text-[34px] font-medium text-[#e3c46a]">
          S${total}.00
        </p>

        <PayNote>
          Add {ref} as the reference so we can match your payment.
        </PayNote>
        <PayNote>
          Please make sure to share your screenshot on +6598193518 to receive
          the confirmed tickets.
        </PayNote>
      </div>

      <button
        type="button"
        onClick={() => goNext()}
        className="mt-[18px] w-full max-w-[480px] rounded-pill bg-gold py-[15px] text-[16px] font-semibold text-[#241a06]"
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
function PayNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex w-full gap-3 rounded-[12px] border-[0.5px] border-[#3a2f18] bg-[#100d07] px-4 py-[13px]">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[12px] bg-[#e5b52a] text-[14px] font-bold text-[#241a06]">
        !
      </span>
      <p className="text-[14px] leading-[1.5] text-[#9a7f3e]">{children}</p>
    </div>
  );
}

function PlaceholderQr() {
  const cells: { x: number; y: number }[] = [];
  let seed = 7;
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      if (row >= 9 && row <= 15 && col >= 8 && col <= 16) continue;
      seed = (seed * 1103515245 + 12345) % 2147483648;
      if (seed / 2147483648 < 0.42) {
        cells.push({ x: 12 + col * 8, y: 12 + row * 8 });
      }
    }
  }
  return (
    <svg
      viewBox="0 0 224 224"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="8" height="8" fill="#7b1f8a" />
      ))}
    </svg>
  );
}
