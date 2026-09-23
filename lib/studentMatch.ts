export type NameFields = {
  name?: string | null;
  preferredName?: string | null;
  officialName?: string | null;
  familyName?: string | null;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function tokens(value: string | null | undefined): string[] {
  if (!value) return [];
  return normalize(value).split(" ").filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function sameStudentName(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function joinNames(...parts: Array<string | null | undefined>): string | null {
  const joined = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return joined || null;
}

/** Preferred, official, family, and official+preferred in either order. */
export function studentNameForms(student: NameFields): string[] {
  const preferred = student.preferredName?.trim() || "";
  const official = student.officialName?.trim() || "";
  const family = student.familyName?.trim() || "";
  const distinctGiven =
    preferred && official && normalize(preferred) !== normalize(official);

  return unique(
    [
      student.name,
      preferred,
      official,
      joinNames(official, family),
      joinNames(preferred, family),
      distinctGiven ? joinNames(official, preferred) : null,
      distinctGiven ? joinNames(preferred, official) : null,
      distinctGiven ? joinNames(official, preferred, family) : null,
      distinctGiven ? joinNames(preferred, official, family) : null,
      distinctGiven ? joinNames(official, family, preferred) : null,
      distinctGiven ? joinNames(preferred, family, official) : null,
    ].filter((form): form is string => Boolean(form)),
  );
}

/**
 * Exact match on a known name form, or on the same words in any order
 * as long as the typed text includes a given name (preferred or official).
 * Family name alone is not enough.
 */
export function studentMatchesExact(student: NameFields, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (studentNameForms(student).some((form) => sameStudentName(form, trimmed))) {
    return true;
  }

  const queryTokens = tokens(trimmed);
  if (queryTokens.length === 0) return false;

  const given = new Set([...tokens(student.preferredName), ...tokens(student.officialName)]);
  const all = new Set([
    ...tokens(student.name),
    ...tokens(student.preferredName),
    ...tokens(student.officialName),
    ...tokens(student.familyName),
  ]);
  return (
    queryTokens.every((token) => all.has(token)) &&
    queryTokens.some((token) => given.has(token))
  );
}
