/**
 * Family names shown on the table-map popover. No local imports so node:test
 * can load this file.
 */

export const SEATED_HERE_CAP = 4;

export type StudentNameFields = {
  name?: string | null;
  preferred_name?: string | null;
  family_name?: string | null;
};

export type SeatedFamilyCard = {
  label: string;
  partySize: number;
  seatsLabel: string;
};

export type SeatedHereView =
  | { kind: "hidden" }
  | { kind: "empty" }
  | { kind: "list"; cards: SeatedFamilyCard[]; more: number };

function firstWord(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean)[0] ?? "";
}

function lastWord(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function initialOf(value: string): string {
  const letter = value.trim().charAt(0);
  return letter ? letter.toUpperCase() : "";
}

/**
 * FIRST NAME + LAST-NAME INITIAL — "Ruhani S.", "Asep P.".
 * Preferred name plus the first letter of family_name. A single-word name
 * with no family name is shown as-is.
 */
export function seatedFamilyLabel(
  student: StudentNameFields | StudentNameFields[] | null | undefined,
): string {
  const row = Array.isArray(student) ? student[0] : student;
  const preferred = row?.preferred_name?.trim() ?? "";
  const family = row?.family_name?.trim() ?? "";
  const full = row?.name?.trim() ?? "";

  const given = preferred || firstWord(full);
  if (!given) return "Guest";

  const familyInitial = family
    ? initialOf(family)
    : (() => {
        const last = lastWord(full);
        if (!last || last.toLowerCase() === given.toLowerCase()) return "";
        return initialOf(last);
      })();

  if (!familyInitial) return given;
  return `${given} ${familyInitial}.`;
}

export function seatCountLabel(partySize: number): string {
  return partySize === 1 ? "1 seat" : `${partySize} seats`;
}

export function mapSeatedFamilies(
  rows: {
    party_size: number;
    students?: StudentNameFields | StudentNameFields[] | null;
  }[],
): SeatedFamilyCard[] {
  return rows.map((row) => ({
    label: seatedFamilyLabel(row.students),
    partySize: row.party_size,
    seatsLabel: seatCountLabel(row.party_size),
  }));
}

export function seatedHereView(
  cards: SeatedFamilyCard[],
  enabled: boolean,
  cap: number = SEATED_HERE_CAP,
): SeatedHereView {
  if (!enabled) return { kind: "hidden" };
  if (cards.length === 0) return { kind: "empty" };
  if (cards.length <= cap) return { kind: "list", cards, more: 0 };
  return {
    kind: "list",
    cards: cards.slice(0, cap),
    more: cards.length - cap,
  };
}

export function moreFamiliesLine(more: number): string {
  return `+${more} more ${more === 1 ? "family" : "families"}`;
}
