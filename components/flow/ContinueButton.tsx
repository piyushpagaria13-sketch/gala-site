"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  partySeatCount,
  useBookingDraft,
} from "@/lib/bookingDraft";
import { syncSheetAfterChange } from "@/app/actions/syncSheet";
import {
  BookingCapacityError,
  createBooking,
} from "@/lib/bookings";
import { matchStudent } from "@/lib/students";

/**
 * Header CTA for the booking flow shell. Enabled when the current step
 * reports itself valid via the booking draft context.
 */
export function ContinueButton() {
  const {
    stepValid,
    goNext,
    goToStep,
    step,
    resetDraft,
    draft,
    setDraft,
    compModalSeenIds,
    markCompModalSeen,
    compModalOpen,
    openCompModal,
    closeCompModal,
  } = useBookingDraft();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (step === "pay") return <span className="w-[44px]" aria-hidden />;

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
      void syncSheetAfterChange().catch((error) => {
        console.error("Sheet sync failed", error);
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
        <p className="absolute right-0 top-full mt-1 w-56 text-right text-[11px] text-[#e0937d]">
          {error}
        </p>
      )}
    </div>
  );
}
