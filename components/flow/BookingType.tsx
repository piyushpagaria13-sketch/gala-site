"use client";

import Image from "next/image";
import { SeatCountModal } from "@/components/flow/SeatCountModal";
import { useBookingDraft, type BookingKind } from "@/lib/bookingDraft";

/**
 * Step 2 — booking type. Figma frames "D2a · Booking type — none (dark)"
 * (253:15) and "D2b · Booking type — seats selected (dark)" (253:49).
 * Selecting a card marks the step valid; the selected card gets a gold
 * border, glow, and check badge.
 * TODO: replace the placeholder illustration slots with final artwork.
 */

const OPTIONS: {
  kind: BookingKind;
  title: string;
  caption: string;
  slotLabel: string;
}[] = [
  {
    kind: "table",
    title: "Book a table",
    caption: "Seats 10 guests",
    slotLabel: "table illustration",
  },
  {
    kind: "seats",
    title: "Book seats",
    caption: "Join a table",
    slotLabel: "chair illustration",
  },
];

export function BookingType() {
  const { draft, setDraft, setStepValid } = useBookingDraft();

  const select = (kind: BookingKind) => {
    setDraft({ ...draft, type: kind });
    setStepValid(true);
  };

  return (
    <div className="flex w-full flex-col items-center px-4 pt-[96px]">
      <p className="text-center text-[13px] font-medium uppercase tracking-[2.34px] text-[#9a7f3e]">
        BOOKING FOR {(draft.student?.name ?? "").toUpperCase()}
      </p>
      <h1 className="mt-[18px] text-center font-display text-[28px] font-medium text-[#e3c46a] sm:text-[32px]">
        How are you booking?
      </h1>

      <div className="mt-[52px] flex flex-col gap-6 sm:flex-row">
        {OPTIONS.map((option) => {
          const selected = draft.type === option.kind;
          return (
            <button
              key={option.kind}
              type="button"
              aria-pressed={selected}
              onClick={() => select(option.kind)}
              className={`relative flex w-[270px] flex-col items-center rounded-card-lg px-[22px] pb-7 pt-[30px] text-center transition-colors ${
                selected
                  ? "border-[3px] border-gold bg-[#241d0f] shadow-[0px_0px_28px_0px_rgba(212,175,55,0.14)]"
                  : "border border-[#6e5a2b] bg-[#1a1610]"
              }`}
            >
              {selected && (
                <Image
                  src="/book/check-badge.svg"
                  alt=""
                  width={26}
                  height={26}
                  className="absolute right-[15px] top-[9px]"
                />
              )}
              <span className="flex h-[150px] w-full items-center justify-center">
                <span className="flex flex-col items-center gap-2">
                  <Image
                    src="/book/icon-photo.svg"
                    alt=""
                    width={28}
                    height={24}
                  />
                  <span
                    className={`text-[12px] ${
                      selected ? "text-[#9a7f3e]" : "text-[#77633a]"
                    }`}
                  >
                    {option.slotLabel}
                  </span>
                </span>
              </span>
              <span
                className={`mt-[14px] text-[20px] font-medium ${
                  selected ? "text-[#e8d9a8]" : "text-[#d9bd6f]"
                }`}
              >
                {option.title}
              </span>
              <span className="mt-[6px] text-[14px] text-[#9a7f3e]">
                {option.caption}
              </span>
            </button>
          );
        })}
      </div>

      <SeatCountModal />
    </div>
  );
}
