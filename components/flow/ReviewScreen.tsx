"use client";

import Image from "next/image";
import { useState } from "react";
import { BusModal, CountModal } from "@/components/flow/BusModal";
import { partySeatCount, useBookingDraft } from "@/lib/bookingDraft";
import { bookingTotal, payableSeats, SEAT_PRICE } from "@/lib/pricing";

/**
 * "Almost there" — review before Confirm & pay. Left: YOUR SEATS card with
 * the guest list plus optional car parking and Shuttle bus.
 * Right: PAYMENT summary with the PayNow note. Everything is read from the
 * draft; nothing is written to Supabase from this screen.
 */
export function ReviewScreen() {
  const { draft, setDraft, goToStep } = useBookingDraft();
  const [parkingOpen, setParkingOpen] = useState(false);
  const [busOpen, setBusOpen] = useState(false);

  const seats = partySeatCount(draft);
  const student = draft.student?.name ?? "";
  const comps = draft.student?.compSeats ?? 0;
  const payable = payableSeats(seats, comps);
  const total = bookingTotal(seats, comps);

  return (
    <div className="flex w-full flex-col items-center px-4 pb-8 pt-[30px]">
      <h1 className="text-center font-display text-[28px] font-medium text-[#e3c46a]">
        Almost there
      </h1>
      <p className="mt-[6px] text-center text-[15px] text-[#9a7f3e]">
        Check the details before you pay.
      </p>

      <div className="mt-[26px] flex w-full max-w-[612px] flex-col items-start gap-3 sm:flex-row sm:gap-5">
        {/* Left column — seats + optional add-ons */}
        <div className="flex w-full flex-col gap-3 sm:w-[296px]">
          <div className="w-full rounded-card border border-[#6e5a2b] bg-[#1a1610] px-5 pb-[22px] pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium tracking-[1.44px] text-gold">
                YOUR SEATS
              </p>
              <button
                type="button"
                onClick={() => goToStep("guests")}
                className="text-[13px] text-[#c9a648] underline"
              >
                Edit
              </button>
            </div>
            <p className="mt-[14px] font-display text-[30px] font-medium text-[#e8d9a8]">
              Table {draft.tableNo}
            </p>
            <p className="mt-[6px] text-[14px] text-[#9a7f3e]">
              {seats} {seats === 1 ? "seat" : "seats"} · under {student}
            </p>
            <div className="mt-[14px] h-px w-full bg-[#3a2f18]" />
            <div className="mt-3 flex flex-col gap-[6px]">
              {draft.guests.map((guest, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between text-[14px]"
                >
                  <span className="flex gap-1">
                    <span className="text-[#d9bd6f]">{guest.name}</span>
                  </span>
                  <span className="text-[#9a7f3e]">{guest.dietary}</span>
                </div>
              ))}
            </div>
          </div>

          <OptionCard
            label="Car parking"
            value={
              draft.cars > 0
                ? `${draft.cars} ${draft.cars === 1 ? "pass" : "passes"}`
                : null
            }
            onClick={() => setParkingOpen(true)}
          />
          <OptionCard
            label="Shuttle bus"
            value={
              draft.busSeats > 0
                ? `${draft.busSeats} ${draft.busSeats === 1 ? "seat" : "seats"}`
                : null
            }
            onClick={() => setBusOpen(true)}
          />
        </div>

        {/* Right column — payment summary */}
        <div className="w-full rounded-card border border-[#6e5a2b] bg-[#1a1610] px-5 pb-[22px] pt-5 sm:w-[296px]">
          <p className="text-[12px] font-medium tracking-[1.44px] text-gold">
            PAYMENT
          </p>
          <div className="mt-4 flex items-baseline justify-between text-[14px]">
            <span className="text-[#9a7f3e]">
              {seats} {seats === 1 ? "seat" : "seats"} × S${SEAT_PRICE}
            </span>
            <span className="text-[#d9bd6f]">S${seats * SEAT_PRICE}</span>
          </div>
          {comps > 0 && (
            <div className="mt-2 text-[14px] text-[#9a7f3e]">
              − {comps} complimentary seats · S$0
            </div>
          )}
          <div className="mt-[14px] h-px w-full bg-[#3a2f18]" />
          <div className="mt-[14px] flex items-baseline justify-between">
            <span className="text-[15px] font-medium text-[#e8d9a8]">
              Total
            </span>
            <span className="font-display text-[30px] font-medium text-[#e3c46a]">
              S${total}
            </span>
          </div>
          <div className="mt-[18px] rounded-[10px] border-[0.5px] border-[#3a2f18] bg-[#100d07] px-[14px] py-3">
            <p className="text-[13px] leading-[1.5] text-[#9a7f3e]">
              {payable === 0
                ? "Nothing to pay — complimentary seats cover this booking."
                : "Pay via PayNow, QR on the next step. Your seats are held while the confirmation of payment is cross-checked."}
            </p>
          </div>
        </div>
      </div>

      <CountModal
        open={parkingOpen}
        onClose={() => setParkingOpen(false)}
        titleId="parking-dialog-title"
        title="Car parking"
        description="Complimentary parking passes for on-site parking at Raffles City."
        fieldLabel="Parking passes"
        saved={draft.cars}
        onSave={(cars) => setDraft({ ...draft, cars })}
      />
      <BusModal open={busOpen} onClose={() => setBusOpen(false)} />
    </div>
  );
}

/** Dashed optional add-card ("Shuttle bus"). */
function OptionCard({
  label,
  value,
  onClick,
}: {
  label: string;
  /** Saved summary (e.g. "2 cars"); null renders the empty "(optional)" state. */
  value: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-card border-[1.5px] border-dashed border-[#8a6f35] px-5 py-4 transition-colors hover:border-gold"
    >
      <span className="flex items-baseline gap-[6px] text-[16px]">
        <span className="font-medium text-gold">{label}</span>
        {value ? (
          <span className="text-[#d9bd6f]">{value}</span>
        ) : (
          <span className="text-[#77633a]">(optional)</span>
        )}
      </span>
      <Image src="/book/icon-plus.svg" alt="" width={14} height={14} />
    </button>
  );
}

