/** Same cap as TABLE_CAPACITY. Inlined so node:test can load this file. */
const TABLE_CAPACITY = 10;

type Guest = {
  name: string;
  kind?: "student" | "guest";
  graduatingStudent?: string;
  title?: string;
  dietary?: string;
  allergyNote?: string;
  age?: string;
};

export const TABLE_ROSTER_MESSAGE =
  "A table is 10 seats. Fill every guest card.";

export const DUPLICATE_STUDENT_MESSAGE =
  "This student is already on another card.";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isStudentCard(guest: Guest, index: number): boolean {
  if (guest.kind === "student") return true;
  if (guest.kind === "guest") return false;
  return index === 0;
}

/** Indexes of cards that reuse a student already on another card. */
export function duplicateStudentIndexes(guests: Guest[]): number[] {
  const studentNames = new Set<string>();
  guests.forEach((guest, index) => {
    if (!isStudentCard(guest, index)) return;
    const name = normalizeName(guest.name);
    if (name) studentNames.add(name);
  });

  const seen = new Map<string, number>();
  const dupes: number[] = [];
  guests.forEach((guest, index) => {
    const name = normalizeName(guest.name);
    if (!name) return;
    if (isStudentCard(guest, index)) {
      const first = seen.get(name);
      if (first !== undefined) {
        if (!dupes.includes(first)) dupes.push(first);
        dupes.push(index);
      } else {
        seen.set(name, index);
      }
      return;
    }
    if (studentNames.has(name)) dupes.push(index);
  });
  return dupes;
}

function isBlankGuest(guest: Guest): boolean {
  return (
    !guest.name.trim() &&
    !guest.graduatingStudent?.trim() &&
    !guest.title &&
    !guest.dietary &&
    !guest.allergyNote
  );
}

/** One student card, then blank guest cards, up to the table cap of 10. */
export function startingGuestCards(
  studentName: string,
  count: number,
): Guest[] {
  const n = Math.max(1, Math.min(Math.floor(count), TABLE_CAPACITY));
  const cards: Guest[] = [{ name: studentName, kind: "student" }];
  for (let i = 1; i < n; i++) {
    cards.push({ name: "", kind: "guest" });
  }
  return cards;
}

/** Drop empty cards at the end so Add student / Add guest can show again. */
export function trimTrailingBlankGuests(
  guests: Guest[],
  minCount = 2,
): Guest[] {
  const next = guests.slice(0, TABLE_CAPACITY);
  const floor = Math.max(1, Math.min(minCount, TABLE_CAPACITY));
  while (next.length > floor && isBlankGuest(next[next.length - 1]!)) {
    next.pop();
  }
  return next;
}

export function canAddGuestCard(guests: Guest[]): boolean {
  return guests.length < TABLE_CAPACITY;
}

export function appendGuestCard(
  guests: Guest[],
  kind: "student" | "guest",
): Guest[] {
  if (guests.length >= TABLE_CAPACITY) return guests;
  return [...guests, { name: "", kind }];
}

/**
 * A whole-table booking is always 10 people: keep filled cards, pad blanks,
 * never grow past 10.
 */
export function padTableGuests(
  existing: Guest[],
  studentName: string,
): Guest[] {
  const kept = existing.slice(0, TABLE_CAPACITY);
  if (kept.length === 0) {
    return startingGuestCards(studentName, TABLE_CAPACITY);
  }
  const next = kept.map((guest, i) =>
    i === 0
      ? {
          ...guest,
          kind: "student" as const,
          name: guest.name.trim() || studentName,
        }
      : guest,
  );
  while (next.length < TABLE_CAPACITY) {
    next.push({ name: "", kind: "guest" });
  }
  return next;
}

/** A guest card is complete once name, graduating student, relationship, and dietary are filled. Students skip guest-only fields. */
export function isGuestComplete(guest: Guest): boolean {
  if (guest.kind === "student") {
    return Boolean(guest.name.trim() && guest.dietary);
  }
  return Boolean(
    guest.name.trim() &&
      guest.graduatingStudent?.trim() &&
      guest.title &&
      guest.dietary,
  );
}

/** Table bookings need 10 complete cards. Seats bookings need every current card complete. Duplicate student names are never complete. */
export function isGuestRosterComplete(
  type: "table" | "seats" | null,
  guests: Guest[],
): boolean {
  if (guests.length === 0 || !guests.every(isGuestComplete)) return false;
  if (duplicateStudentIndexes(guests).length > 0) return false;
  if (type === "table") return guests.length === TABLE_CAPACITY;
  return true;
}
