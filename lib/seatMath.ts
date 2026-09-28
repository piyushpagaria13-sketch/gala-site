/**
 * Pure seat math for the table map. Counts are always DERIVED, never stored:
 * booked = Σ party_size of non-cancelled bookings; remaining = capacity − booked.
 * The user's own uncommitted party is a client-side preview only — it must
 * never be added into fetched counts or written anywhere.
 */

export const TABLE_CAPACITY = 10;

export type SeatDot = "solid" | "selected" | "empty";

/** Derive a table's fill state from the party sizes of committed bookings. */
export function derive(
  bookedParties: number[],
  capacity: number = TABLE_CAPACITY,
): { filled: number; remaining: number } {
  const filled = bookedParties.reduce((sum, n) => sum + n, 0);
  return { filled, remaining: capacity - filled };
}

export type CanSelectResult = { ok: true } | { ok: false; error: string };

/** Shown when a party would push a table past 10 seats. */
export const TABLE_FULL_MESSAGE =
  "The table is at full capacity. Please try to book some other table.";

/**
 * Capacity check, run only when "Choose this table" is clicked — never
 * pre-disable the button. A table holds at most 10 seats across all bookings.
 */
export function canSelect(remaining: number, party: number): CanSelectResult {
  if (remaining >= party) return { ok: true };
  return { ok: false, error: TABLE_FULL_MESSAGE };
}

/**
 * Seat-dot row: committed seats solid, the user's own (uncommitted) party as
 * "selected" preview dots, the rest empty rings.
 */
export function dotRow(
  confirmed: number,
  selectedParty: number,
  capacity: number = TABLE_CAPACITY,
): SeatDot[] {
  return Array.from({ length: capacity }, (_, i) => {
    if (i < confirmed) return "solid";
    if (i < confirmed + selectedParty) return "selected";
    return "empty";
  });
}

/** Toast copy when create_booking rejects a stale selection at commit time. */
export function commitRejectionMessage(_tableNo?: number): string {
  return TABLE_FULL_MESSAGE;
}
