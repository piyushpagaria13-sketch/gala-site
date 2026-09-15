"use client";

import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Guest, Student } from "./types";

export type BookingKind = "seats" | "table";

export type BookingContact = {
  email?: string;
  phone?: string;
};

export type BookingDraft = {
  student: Student | null;
  type: BookingKind | null;
  partySize: number | null;
  tableNo: number | null;
  guests: Guest[];
  cars: number;
  busSeats: number;
  contact: BookingContact | null;
  /**
   * Booking reference (GALA-NNNN) shown on the pay + confirmation screens.
   * TODO: replace the local placeholder with the ref returned by create_booking.
   */
  bookingRef: string | null;
};

const EMPTY_DRAFT: BookingDraft = {
  student: null,
  type: null,
  partySize: null,
  tableNo: null,
  guests: [],
  cars: 0,
  busSeats: 0,
  contact: null,
  bookingRef: null,
};

export type BookingStep =
  | "student"
  | "type"
  | "table"
  | "guests"
  | "review"
  | "pay"
  | "done";

const STEP_ORDER: BookingStep[] = [
  "student",
  "type",
  "table",
  "guests",
  "review",
  "pay",
  "done",
];

type BookingDraftContextValue = {
  draft: BookingDraft;
  setDraft: (next: BookingDraft) => void;
  resetDraft: () => void;
  /** Whether the current flow step is complete enough to continue. */
  stepValid: boolean;
  setStepValid: (valid: boolean) => void;
  /** Current step in the booking flow. */
  step: BookingStep;
  goNext: () => void;
  goBack: () => void;
  /** Jump directly to a step (e.g. after the seat-count dialog confirms). */
  goToStep: (target: BookingStep) => void;
  /** "How many seats?" dialog (seats path only). */
  seatCountOpen: boolean;
  setSeatCountOpen: (open: boolean) => void;
};

const BookingDraftContext = createContext<BookingDraftContextValue | null>(
  null,
);

const STORAGE_KEY = "gala-booking-draft";

/** A guest card is complete once name, age and dietary choice are filled. */
export function isGuestComplete(guest: Guest): boolean {
  return Boolean(guest.name.trim() && guest.age?.trim() && guest.dietary);
}

/** Validity of a step, derived from what the draft already holds. */
function isStepComplete(step: BookingStep, draft: BookingDraft): boolean {
  switch (step) {
    case "student":
      return Boolean(draft.student?.name.trim());
    case "type":
      return draft.type !== null;
    case "table":
      return draft.tableNo !== null;
    case "guests":
      return draft.guests.length > 0 && draft.guests.every(isGuestComplete);
    case "review":
      // "Confirm & pay" is always actionable; the create_booking RPC is the
      // final validator.
      return true;
    case "pay":
      // No header CTA on the pay screen — "I've paid" lives in the content.
      return false;
    case "done":
      // Terminal screen — no Continue; the header × closes the flow.
      return false;
  }
}

export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<BookingDraft>(EMPTY_DRAFT);
  const [stepValid, setStepValid] = useState(false);
  const [step, setStep] = useState<BookingStep>("student");
  const [seatCountOpen, setSeatCountOpen] = useState(false);

  const value = useMemo<BookingDraftContextValue>(
    () => ({
      draft,
      setDraft: (next) => {
        // TODO: persist to localStorage under STORAGE_KEY
        void STORAGE_KEY;
        setDraftState(next);
      },
      resetDraft: () => {
        // TODO: clear localStorage persistence
        setDraftState(EMPTY_DRAFT);
        setStepValid(false);
        setStep("student");
        setSeatCountOpen(false);
      },
      stepValid,
      setStepValid,
      step,
      goNext: () => {
        // Seats path: ask for the seat count before moving on.
        if (step === "type" && draft.type === "seats") {
          setSeatCountOpen(true);
          return;
        }
        const next = STEP_ORDER[STEP_ORDER.indexOf(step) + 1];
        if (next) {
          setStep(next);
          setStepValid(isStepComplete(next, draft));
        }
        // TODO: steps beyond "guests" (review, pay, confirmation)
      },
      goBack: () => {
        const prev = STEP_ORDER[STEP_ORDER.indexOf(step) - 1];
        if (prev) {
          setStep(prev);
          setStepValid(isStepComplete(prev, draft));
        }
      },
      goToStep: (target) => {
        setStep(target);
        setStepValid(isStepComplete(target, draft));
      },
      seatCountOpen,
      setSeatCountOpen,
    }),
    [draft, stepValid, step, seatCountOpen],
  );

  // TODO: hydrate draft from localStorage on mount.
  // RULE: nothing is written to Supabase until Confirm & pay.

  return createElement(BookingDraftContext.Provider, { value }, children);
}

export function useBookingDraft() {
  const ctx = useContext(BookingDraftContext);
  if (!ctx) {
    throw new Error("useBookingDraft must be used within BookingDraftProvider");
  }
  return ctx;
}
