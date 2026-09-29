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
import { AddGuestCard } from "@/components/flow/AddGuestCard";
import { TABLE_CAPACITY } from "@/lib/floorplan";
import {
    appendGuestCard,
    canAddGuestCard,
    isGuestRosterComplete,
    padSeatGuests,
    padTableGuests,
    TABLE_ROSTER_MESSAGE,
} from "@/lib/guestRoster";
import { matchStudent, studentHasLiveBooking } from "@/lib/students";
import { reviewCtaLabel } from "@/lib/confirmationCopy";
import { payableSeats } from "@/lib/pricing";
import { NAME_ALREADY_BOOKED_MESSAGE } from "@/lib/studentBooking";

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
 * Sticky bottom CTA. Add student / Add guest sit here on the guests step so
 * they are never hidden under the button. A black fade covers scrolling
 * cards just above this bar.
 */
export function ContinueDock() {
  const { step, seatCountOpen, compModalOpen, draft, setDraft } =
    useBookingDraft();
  const showCta =
    step !== "pay" &&
    step !== "done" &&
    !seatCountOpen &&
    !compModalOpen;
  const reserved =
    draft.type === "table"
      ? TABLE_CAPACITY
      : Math.max(1, Math.min(draft.partySize ?? 1, TABLE_CAPACITY));
  const roster =
    draft.guests.length > 0
      ? draft.guests.slice(0, TABLE_CAPACITY)
      : draft.type === "table"
        ? padTableGuests(draft.guests, draft.student?.name ?? "")
        : padSeatGuests(
            draft.guests,
            draft.student?.name ?? "",
            reserved,
          );
  const showAdd = step === "guests";
  const isTable = draft.type === "table";
  const addDisabled = !canAddGuestCard(roster);

  const addCard = (kind: "student" | "guest") => {
    const next = appendGuestCard(roster, kind);
    setDraft({
      ...draft,
      guests: next,
      partySize: isTable ? TABLE_CAPACITY : next.length,
    });
  };

  return (
    <div className="relative z-20 shrink-0">
      {showCta && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-black to-transparent"
        />
      )}
      <div
        className={
          showCta
            ? "relative bg-black px-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            : "relative bg-[#131008] px-7 pb-5 pt-2"
        }
      >
        {showAdd && (
          <div className="mx-auto mb-3 grid w-full max-w-[612px] grid-cols-2 gap-4">
            <AddGuestCard
              label="Add student"
              disabled={addDisabled}
              onAdd={() => addCard("student")}
            />
            <AddGuestCard
              label="Add guest"
              disabled={addDisabled}
              onAdd={() => addCard("guest")}
            />
          </div>
        )}
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

  const rosterGuests =
    draft.type === "table"
      ? padTableGuests(draft.guests, draft.student?.name ?? "")
      : draft.guests;
  const rosterReady =
    step === "guests" || step === "review"
      ? isGuestRosterComplete(draft.type, rosterGuests, draft.partySize)
      : true;
  const payable = payableSeats(
    partySeatCount(draft),
    draft.student?.compSeats ?? 0,
  );

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
          if (await studentHasLiveBooking(match.id)) {
            setError(NAME_ALREADY_BOOKED_MESSAGE);
            return;
          }
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

    if (step === "guests") {
      if (!isGuestRosterComplete(draft.type, rosterGuests, draft.partySize)) return;
      goNext();
      return;
    }

    if (step !== "review") {
      goNext();
      return;
    }

    const studentId = draft.student?.id?.trim() || null;
    if (draft.tableNo == null) return;
    if (!isGuestRosterComplete(draft.type, rosterGuests, draft.partySize)) {
      setError(
        draft.type === "table"
          ? TABLE_ROSTER_MESSAGE
          : "Fill every guest card before continuing.",
      );
      goToStep("guests");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const created = await createBooking({
        tableNo: draft.tableNo,
        partySize: partySeatCount(draft),
        studentId,
        guests: rosterGuests,
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
        guests: rosterGuests.map((guest) => guest.name),
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
    <div className="flex flex-col items-center">
      {error && (
        <p className="mb-2 max-w-[22rem] text-center text-[13px] leading-snug text-[#e0937d]">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={!stepValid || busy || !rosterReady}
        onClick={() => void handleClick()}
        className="rounded-pill bg-gold px-7 py-3 text-[16px] font-semibold text-[#241a06] transition-opacity disabled:opacity-[0.35]"
      >
        {step === "review"
          ? busy
            ? "Booking…"
            : reviewCtaLabel(payable)
          : "Continue"}
      </button>
    </div>
  );
}
