"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { GuestCard } from "@/components/flow/GuestCard";
import { useBookingDraft } from "@/lib/bookingDraft";
import { CLASS_NAMES } from "@/lib/classList";
import { TABLE_CAPACITY } from "@/lib/floorplan";
import {
  DUPLICATE_STUDENT_MESSAGE,
  duplicateStudentIndexes,
  isGuestRosterComplete,
  padTableGuests,
  startingGuestCards,
  trimTrailingBlankGuests,
} from "@/lib/guestRoster";
import type { Guest } from "@/lib/types";

function isStudent(guest: Guest, index: number): boolean {
  if (guest.kind === "student") return true;
  if (guest.kind === "guest") return false;
  return index === 0;
}

/**
 * "Who's coming?" A table starts with 10 cards; Add student / Add guest stay
 * visible but disabled until a card is deleted. Seats start with two cards
 * and grow up to 10.
 */
export function GuestGrid() {
  const { draft, setDraft, setStepValid } = useBookingDraft();
  const isTable = draft.type === "table";
  const studentName = draft.student?.name ?? "";
  const startCount = isTable ? TABLE_CAPACITY : Math.min(2, draft.partySize ?? 2);
  const start = startingGuestCards(studentName, startCount);
  const guests: Guest[] = (
    draft.guests.length > 0 ? draft.guests : start
  ).slice(0, TABLE_CAPACITY);
  const seededTable = useRef(false);

  useLayoutEffect(() => {
    if (!isTable) {
      seededTable.current = false;
      const trimmed = trimTrailingBlankGuests(
        draft.guests.length > 0 ? draft.guests : start,
        startCount,
      );
      if (draft.guests.length === trimmed.length) return;
      setDraft({
        ...draft,
        guests: trimmed,
        partySize: Math.max(draft.partySize ?? trimmed.length, trimmed.length),
      });
      return;
    }
    if (seededTable.current) return;
    seededTable.current = true;
    const next = padTableGuests(draft.guests, studentName);
    if (
      draft.guests.length === TABLE_CAPACITY &&
      draft.partySize === TABLE_CAPACITY
    ) {
      return;
    }
    setDraft({
      ...draft,
      guests: next,
      partySize: TABLE_CAPACITY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTable]);

  useEffect(() => {
    setStepValid(isGuestRosterComplete(draft.type, guests));
  }, [draft.type, guests, setStepValid]);

  const commit = (next: Guest[]) => {
    const clipped = next.slice(0, TABLE_CAPACITY);
    const size = clipped.length;
    setDraft({
      ...draft,
      guests: clipped,
      partySize: isTable
        ? TABLE_CAPACITY
        : Math.max(draft.partySize ?? size, size),
      cars: Math.min(draft.cars, size),
      busSeats: Math.min(draft.busSeats, size),
    });
  };

  const update = (index: number, nextGuest: Guest) => {
    commit(guests.map((g, i) => (i === index ? nextGuest : g)));
  };

  const removeGuest = (index: number) => {
    if (guests.length <= 1) return;
    commit(guests.filter((_, i) => i !== index));
  };

  const takenStudentNames = new Set(
    guests
      .map((guest, index) =>
        isStudent(guest, index) ? guest.name.trim().replace(/\s+/g, " ").toLowerCase() : "",
      )
      .filter(Boolean),
  );
  const duplicateIndexes = new Set(duplicateStudentIndexes(guests));
  let studentCount = 0;
  let guestCount = 0;

  return (
    <div className="flex w-full flex-col items-center px-4 pb-8 pt-[30px]">
      <h1 className="text-center font-display text-[28px] font-medium text-[#e3c46a]">
        Who&apos;s coming?
      </h1>
      <p className="mt-[6px] text-center text-[15px] text-[#9a7f3e]">
        {isTable
          ? "A table is 10 seats. Fill every card."
          : "Dietary preferences help us plan the dinner."}
      </p>

      <div className="mt-[26px] grid w-full max-w-[612px] grid-cols-1 gap-5 sm:grid-cols-2">
        {guests.map((guest, i) => {
          const student = isStudent(guest, i);
          if (student) studentCount += 1;
          else guestCount += 1;
          const title = student
            ? studentCount === 1
              ? "Student"
              : `Student ${studentCount}`
            : isTable
              ? `Guest ${guestCount}`
              : `Guest ${i + 1}`;
          const ownName = guest.name.trim().replace(/\s+/g, " ").toLowerCase();
          const nameOptions = student
            ? CLASS_NAMES.filter((name) => {
                const key = name.trim().replace(/\s+/g, " ").toLowerCase();
                return key === ownName || !takenStudentNames.has(key);
              })
            : undefined;
          return (
            <GuestCard
              key={i}
              title={title}
              badge={student ? "GRADUATE" : undefined}
              guest={guest}
              nameOptions={nameOptions}
              nameError={
                duplicateIndexes.has(i) ? DUPLICATE_STUDENT_MESSAGE : undefined
              }
              onChange={(next) => update(i, next)}
              onDelete={
                guests.length <= 1 ? undefined : () => removeGuest(i)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
