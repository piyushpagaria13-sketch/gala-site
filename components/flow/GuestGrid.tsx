"use client";

import { useEffect } from "react";
import { AddGuestCard } from "@/components/flow/AddGuestCard";
import { GuestCard } from "@/components/flow/GuestCard";
import { isGuestComplete, useBookingDraft } from "@/lib/bookingDraft";
import { TABLE_CAPACITY } from "@/lib/floorplan";
import type { Guest } from "@/lib/types";

function isStudent(guest: Guest, index: number): boolean {
  if (guest.kind === "student") return true;
  if (guest.kind === "guest") return false;
  return index === 0;
}

/**
 * "Who's coming?" — guest details after a table or seats are reserved.
 * Seat 1 is always the graduate. A full table starts as 10 people: two
 * graduates, then guests. The second graduate can be removed; that opens
 * "Add student" and "Add guest" until the table is full again. Seat bookings
 * keep a single "Add another guest" card.
 */
export function GuestGrid() {
  const { draft, setDraft, setStepValid } = useBookingDraft();
  const isTable = draft.type === "table";

  const guests: Guest[] =
    draft.guests.length > 0
      ? draft.guests
      : isTable
        ? [
            { name: draft.student?.name ?? "", kind: "student" },
            { name: "", kind: "student" },
            ...Array.from(
              { length: TABLE_CAPACITY - 2 },
              (): Guest => ({ name: "", kind: "guest" }),
            ),
          ]
        : [
            { name: draft.student?.name ?? "", kind: "student" },
            ...Array.from(
              { length: Math.max(0, (draft.partySize ?? 1) - 1) },
              (): Guest => ({ name: "", kind: "guest" }),
            ),
          ];

  // Persist the initial seed so later adds/removes have a real guest list.
  useEffect(() => {
    if (draft.guests.length > 0) return;
    setDraft({
      ...draft,
      guests,
      partySize: isTable ? TABLE_CAPACITY : guests.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filled = guests.length > 0 && guests.every(isGuestComplete);
    const tableFull = !isTable || guests.length === TABLE_CAPACITY;
    setStepValid(filled && tableFull);
  }, [guests, isTable, setStepValid]);

  const commit = (next: Guest[]) => {
    const size = isTable ? TABLE_CAPACITY : next.length;
    setDraft({
      ...draft,
      guests: next,
      partySize: size,
      cars: Math.min(draft.cars, size),
      busSeats: Math.min(draft.busSeats, size),
    });
  };

  const update = (index: number, nextGuest: Guest) => {
    commit(guests.map((g, i) => (i === index ? nextGuest : g)));
  };

  const addGuest = () => {
    if (guests.length >= TABLE_CAPACITY) return;
    commit([...guests, { name: "", kind: "guest" }]);
  };

  const addStudent = () => {
    if (guests.length >= TABLE_CAPACITY) return;
    const next = [...guests];
    let lastStudent = -1;
    next.forEach((guest, index) => {
      if (isStudent(guest, index)) lastStudent = index;
    });
    next.splice(lastStudent + 1, 0, { name: "", kind: "student" });
    commit(next);
  };

  const removeGuest = (index: number) => {
    if (guests.length <= 1) return;
    if (isStudent(guests[index], index)) {
      const firstStudent = guests.findIndex((guest, i) => isStudent(guest, i));
      if (index === firstStudent) return;
    }
    commit(guests.filter((_, i) => i !== index));
  };

  let studentCount = 0;
  let guestCount = 0;

  return (
    <div className="flex w-full flex-col items-center px-4 pb-8 pt-[30px]">
      <h1 className="text-center font-display text-[28px] font-medium text-[#e3c46a]">
        Who&apos;s coming?
      </h1>
      <p className="mt-[6px] text-center text-[15px] text-[#9a7f3e]">
        Dietary preferences help us plan the dinner.
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
          return (
            <GuestCard
              key={i}
              title={title}
              badge={student ? "GRADUATE" : undefined}
              guest={guest}
              onChange={(next) => update(i, next)}
              onDelete={
                student && studentCount === 1
                  ? undefined
                  : () => removeGuest(i)
              }
            />
          );
        })}
        {guests.length < TABLE_CAPACITY &&
          (isTable ? (
            <div className="grid grid-cols-1 gap-5 sm:col-span-2 sm:grid-cols-2">
              <AddGuestCard label="Add student" onAdd={addStudent} />
              <AddGuestCard label="Add guest" onAdd={addGuest} />
            </div>
          ) : (
            <AddGuestCard onAdd={addGuest} />
          ))}
      </div>
    </div>
  );
}
