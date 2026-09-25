"use client";

import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Guest, Student, BookingStatus } from "./types";
import { TABLE_CAPACITY } from "./floorplan";

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
   */
  bookingRef: string | null;
  bookingId: string | null;
  amount: number | null;
  bookingStatus: BookingStatus | null;
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
  bookingId: null,
  amount: null,
  bookingStatus: null,
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
  /** Student ids that already saw the complimentary-seats modal this session. */
  compModalSeenIds: string[];
  markCompModalSeen: (studentId: string) => void;
  compModalOpen: boolean;
  /** Open the complimentary-seats dialog. If advance, Continue on the dialog goes to the next step. */
  openCompModal: (advance: boolean) => void;
  closeCompModal: () => void;
};

const BookingDraftContext = createContext<BookingDraftContextValue | null>(
  null,
);

const STORAGE_KEY = "gala-booking-draft";

/** Seats in this booking — guest cards are the source of truth on the seats path. */
export function partySeatCount(draft: BookingDraft): number {
  if (draft.type === "table") return TABLE_CAPACITY;
  if (draft.guests.length > 0) return draft.guests.length;
  return draft.partySize ?? 1;
}

/** A guest card is complete once name, title, and dietary choice are filled. Students have no title. */
export function isGuestComplete(guest: Guest): boolean {
  const titled = guest.kind === "student" || Boolean(guest.title);
  return Boolean(guest.name.trim() && guest.dietary && titled);
}

/** Validity of a step, derived from what the draft already holds. */
function isStepComplete(step: BookingStep, draft: BookingDraft): boolean {
  switch (step) {
    case "student":
      return Boolean(
        draft.student?.name.trim() && draft.contact?.phone?.trim(),
      );
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
  const [compModalSeenIds, setCompModalSeenIds] = useState<string[]>([]);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [compModalAdvance, setCompModalAdvance] = useState(false);

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
        setCompModalSeenIds([]);
        setCompModalOpen(false);
        setCompModalAdvance(false);
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
      compModalSeenIds,
      markCompModalSeen: (studentId) => {
        setCompModalSeenIds((ids) =>
          ids.includes(studentId) ? ids : [...ids, studentId],
        );
      },
      compModalOpen,
      openCompModal: (advance) => {
        setCompModalAdvance(advance);
        setCompModalOpen(true);
      },
      closeCompModal: () => {
        setCompModalOpen(false);
        if (compModalAdvance) {
          setCompModalAdvance(false);
          const next = STEP_ORDER[STEP_ORDER.indexOf(step) + 1];
          if (next) {
            setStep(next);
            setStepValid(isStepComplete(next, draft));
          }
        }
      },
    }),
    [
      draft,
      stepValid,
      step,
      seatCountOpen,
      compModalSeenIds,
      compModalOpen,
      compModalAdvance,
    ],
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
