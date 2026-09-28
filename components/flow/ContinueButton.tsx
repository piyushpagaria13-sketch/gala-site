"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  partySeatCount,
  useBookingDraft,
} from "@/lib/bookingDraft";
import { notifyBookingReceived } from "@/app/actions/sendBookingReceived";
import { syncSheetAfterChange } from "@/app/actions/syncSheet";
import {
  BookingCapacityError,
  createBooking,
} from "@/lib/bookings";
import { matchStudent } from "@/lib/students";

/** Close control for the confirmation step — stays in the header. */
export function HeaderTrailing() {
  const { step, resetDraft } = useBookingDraft();
  const router = useRouter();

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

  return <span className="block h-[44px] w-[44px]" aria-hidden />;
}

/**
 * Sticky bottom CTA. A black fade sits behind the button so scrolling
 * content does not run into it.
 */
export function ContinueDock() {
  const { step, seatCountOpen } = useBookingDraft();
  const showCta = step !== "pay" && step !== "done" && !seatCountOpen;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
      {showCta && (
        <div
          aria-hidden
          className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-black to-transparent"
        />
      )}
      <div
        className={
          showCta
            ? "pointer-events-auto relative bg-black px-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            : "pointer-events-auto relative bg-[#131008] px-7 pb-5 pt-2"
        }
      >
        {showCta && (
          <div className="flex justify-center">
            <ContinueButton />
          </div>
        )}
        <p
          className={`text-center text-[12px] text-[#5d4c2b] ${
            showCta ? "mt-3" : ""
          }`}
        >
          UWCSEA Dover · Graduation Gala Dinner
        </p>
      </div>
    </div>
  );
}

/**
 * Primary CTA for the booking flow. Enabled when the current step reports
 * itself valid via the booking draft context.
 */
export function ContinueButton() {
  const {
    stepValid,
    goNext,
    goToStep,
    step,
    draft,
    setDraft,
    compModalSeenIds,
    markCompModalSeen,
    compModalOpen,
    openCompModal,
    closeCompModal,
  } = useBookingDraft();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (compModalOpen) {
      closeCompModal();
      return;
    }

    if (step === "student") {
      setBusy(true);
      setError(null);
      try {
        // An exact match with complimentary seats opens the dialog.
        // Class names and any other typed name continue as a regular booking.
        const match = await matchStudent(draft.student?.name ?? "");
        if (match) {
          setDraft({ ...draft, student: match });
          if (match.compSeats > 0 && !compModalSeenIds.includes(match.id)) {
            markCompModalSeen(match.id);
            openCompModal(true);
            return;
          }
        }
        goNext();
      } catch {
        goNext();
      } finally {
        setBusy(false);
      }
      return;
    }

    if (step !== "review") {
      goNext();
      return;
    }

    const studentId = draft.student?.id?.trim() || null;
    if (draft.tableNo == null) return;

    setBusy(true);
    setError(null);
    try {
      const created = await createBooking({
        tableNo: draft.tableNo,
        partySize: partySeatCount(draft),
        studentId,
        guests: draft.guests,
        cars: draft.cars,
        busSeats: draft.busSeats,
        contact: draft.contact?.phone ?? null,
        email: draft.contact?.email ?? null,
      });
      setDraft({
        ...draft,
        bookingRef: created.ref,
        bookingId: created.id,
        amount: created.amount,
        bookingStatus: created.status,
      });
      void notifyBookingReceived({
        email: draft.contact?.email ?? null,
        ref: created.ref,
        tableNo: draft.tableNo,
        partySize: partySeatCount(draft),
        guests: draft.guests.map((guest) => guest.name),
      });
      void syncSheetAfterChange().catch((sheetError) => {
        console.error("Sheet sync failed", sheetError);
      });
      if (created.amount === 0) {
        goToStep("done");
      } else {
        goToStep("pay");
      }
    } catch (err) {
      if (err instanceof BookingCapacityError) {
        setError(err.message);
        goToStep("table");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not create booking");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!stepValid || busy}
        onClick={() => void handleClick()}
        className="rounded-pill bg-gold px-7 py-3 text-[16px] font-semibold text-[#241a06] transition-opacity disabled:opacity-[0.35]"
      >
        {step === "review"
          ? busy
            ? "Booking…"
            : "Confirm & pay"
          : "Continue"}
      </button>
      {error && (
        <p className="absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 text-center text-[11px] text-[#e0937d]">
          {error}
        </p>
      )}
    </div>
  );
}
