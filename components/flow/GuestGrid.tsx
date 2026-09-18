"use client";

import { useEffect } from "react";
import { AddGuestCard } from "@/components/flow/AddGuestCard";
import { GuestCard } from "@/components/flow/GuestCard";
import { isGuestComplete, useBookingDraft } from "@/lib/bookingDraft";
import { TABLE_CAPACITY } from "@/lib/floorplan";
import type { Guest } from "@/lib/types";

/**
 * "Who's coming?" — guest details after a table/seats are reserved.
 * Seat 1 is always the student. Extra cards are added with "Add another
 * guest" (up to 10). Adding or removing a card updates partySize so the
 * breadcrumb, review, PayNow and confirmation stay in sync.
 */
export function GuestGrid() {
  const { draft, setDraft, setStepValid } = useBookingDraft();

  const guests: Guest[] =
    draft.guests.length > 0
      ? draft.guests
      : [
          { name: draft.student?.name ?? "" },
          ...Array.from(
            {
              length: Math.max(
                0,
                (draft.type === "table"
                  ? TABLE_CAPACITY
                  : (draft.partySize ?? 1)) - 1,
              ),
            },
            (): Guest => ({ name: "" }),
          ),
        ];

  // Persist the initial seed so later adds/removes have a real guest list.
  useEffect(() => {
    if (draft.guests.length > 0) return;
    setDraft({
      ...draft,
      guests,
      partySize:
        draft.type === "table" ? TABLE_CAPACITY : guests.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStepValid(guests.length > 0 && guests.every(isGuestComplete));
  }, [guests, setStepValid]);

  const commit = (next: Guest[]) => {
    setDraft({
      ...draft,
      guests: next,
      partySize: draft.type === "table" ? TABLE_CAPACITY : next.length,
    });
  };

  const update = (index: number, nextGuest: Guest) => {
    commit(guests.map((g, i) => (i === index ? nextGuest : g)));
  };

  const addGuest = () => {
    if (guests.length >= TABLE_CAPACITY) return;
    commit([...guests, { name: "" }]);
  };

  const removeGuest = (index: number) => {
    if (index === 0 || guests.length <= 1) return;
    commit(guests.filter((_, i) => i !== index));
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
        {guests.length < TABLE_CAPACITY && (
          <AddGuestCard onAdd={addGuest} />
        )}
      </div>
    </div>
  );
}
