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
