"use client";

import { useEffect } from "react";
import { AddGuestCard } from "@/components/flow/AddGuestCard";
import { GuestCard } from "@/components/flow/GuestCard";
import { isGuestComplete, useBookingDraft } from "@/lib/bookingDraft";
import { TABLE_CAPACITY } from "@/lib/floorplan";
import type { Guest } from "@/lib/types";

/**
 * "Who's coming?" — guest details after a table/seats are reserved.
 * One card per reserved seat, pre-rendered automatically: the party size on
 * the seats path, all 10 for a whole-table booking. Seat 1 is always the
 * student (name prefilled from the first step, GRADUATE badge). Deleting a
 * card frees a seat and brings back "Add guest". Continue enables once every
 * card has a name, age and dietary choice.
 */
export function GuestGrid() {
  const { draft, setDraft, setStepValid } = useBookingDraft();

  const maxSeats =
    draft.type === "table"
      ? TABLE_CAPACITY
      : (draft.partySize ?? TABLE_CAPACITY);

  // Attendee list; until the draft holds guests, seed one card per reserved
  // seat with the student in seat 1.
  const guests: Guest[] =
    draft.guests.length > 0
      ? draft.guests
      : Array.from({ length: maxSeats }, (_, i) =>
          i === 0 ? { name: draft.student?.name ?? "" } : { name: "" },
        );

  // If the reserved seat count changed since guests were saved (user went
  // back and picked a different party size), pad with empty cards or trim
  // extras so the grid always shows exactly one card per seat.
  useEffect(() => {
    const saved = draft.guests;
    if (saved.length === 0 || saved.length === maxSeats) return;
    const next =
      saved.length < maxSeats
        ? [
            ...saved,
            ...Array.from(
              { length: maxSeats - saved.length },
              (): Guest => ({ name: "" }),
            ),
          ]
        : saved.slice(0, maxSeats);
    setDraft({ ...draft, guests: next });
    // Runs only when the seat count changes — not on every guest edit, so
    // the delete-a-card interaction still works within a visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSeats]);

  useEffect(() => {
    setStepValid(guests.every(isGuestComplete));
  }, [guests, setStepValid]);

  const update = (index: number, next: Guest) => {
    setDraft({
      ...draft,
      guests: guests.map((g, i) => (i === index ? next : g)),
    });
  };

  const addGuest = () => {
    if (guests.length >= maxSeats) return;
    setDraft({ ...draft, guests: [...guests, { name: "" }] });
  };

  const removeGuest = (index: number) => {
    setDraft({ ...draft, guests: guests.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex w-full flex-col items-center px-4 pb-8 pt-[30px]">
      <h1 className="text-center font-display text-[28px] font-medium text-[#e3c46a]">
        Who&apos;s coming?
      </h1>
      <p className="mt-[6px] text-center text-[15px] text-[#9a7f3e]">
        Dietary choices help us plan the dinner.
      </p>

      <div className="mt-[26px] grid w-full max-w-[612px] grid-cols-1 gap-5 sm:grid-cols-2">
        {guests.map((guest, i) => (
          <GuestCard
            key={i}
            title={i === 0 ? "Student" : `Guest ${i + 1}`}
            badge={i === 0 ? "GRADUATE" : undefined}
            guest={guest}
            onChange={(next) => update(i, next)}
            onDelete={i === 0 ? undefined : () => removeGuest(i)}
          />
        ))}
        {guests.length < maxSeats && <AddGuestCard onAdd={addGuest} />}
      </div>
    </div>
  );
}
