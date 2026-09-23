import { getSupabaseClient } from "./supabase";
import type { Student } from "@/lib/types";
import { studentMatchesExact } from "./studentMatch";

export { sameStudentName, studentMatchesExact } from "./studentMatch";

/**
 * Offline fallback only. Complimentary tickets come from the live roster
 * (the 25 reserved recipients). These sample names never receive them.
 */
export const SEED_STUDENTS: Student[] = [
  { id: "local:aryan-tan", name: "Aryan Tan", grade: "12", compSeats: 0 },
  { id: "local:aryan-mehta", name: "Aryan Mehta", grade: "12", compSeats: 0 },
  { id: "local:mei-ling-wong", name: "Mei Ling Wong", grade: "12", compSeats: 0 },
  { id: "local:zara-binte-rahman", name: "Zara Binte Rahman", grade: "12", compSeats: 0 },
  { id: "local:joshua-lim", name: "Joshua Lim", grade: "12", compSeats: 0 },
  { id: "local:priya-krishnan", name: "Priya Krishnan", grade: "12", compSeats: 0 },
  { id: "local:min-jun-park", name: "Min-Jun Park", grade: "12", compSeats: 0 },
  { id: "local:chloe-van-der-berg", name: "Chloe Van Der Berg", grade: "12", compSeats: 0 },
  { id: "local:kabir-shah", name: "Kabir Shah", grade: "12", compSeats: 0 },
  { id: "local:isabella-chen", name: "Isabella Chen", grade: "12", compSeats: 0 },
];

type StudentRow = {
  id: string;
  name: string;
  grade: string | null;
  comp_seats: number | null;
  preferred_name: string | null;
  official_name: string | null;
  family_name: string | null;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function searchTokens(term: string): string[] {
  return term
    .split(/\s+/)
    .map((token) => token.replace(/[,()%]/g, ""))
    .filter((token) => token.length >= 2);
}

/** Display convention: preferred_name + " " + family_name. */
export function studentDisplayName(student: {
  name?: string | null;
  preferredName?: string | null;
  familyName?: string | null;
}): string {
  const display = [student.preferredName, student.familyName]
    .filter(Boolean)
    .join(" ");
  return display || student.name || "";
}

function fromSeed(query: string): Student[] {
  const q = normalize(query);
  if (!q) return [];
  return SEED_STUDENTS.filter(
    (student) =>
      studentMatchesExact(student, query) ||
      student.name.toLowerCase().includes(q) ||
      searchTokens(q).some((token) => student.name.toLowerCase().includes(token)),
  );
}

function fromRow(row: StudentRow): Student {
  const preferredName = row.preferred_name ?? undefined;
  const officialName = row.official_name ?? undefined;
  const familyName = row.family_name ?? undefined;
  return {
    id: row.id,
    name: studentDisplayName({
      name: row.name,
      preferredName,
      familyName,
    }),
    grade: row.grade ?? undefined,
    compSeats: row.comp_seats ?? 0,
    preferredName,
    officialName,
    familyName,
  };
}

/**
 * Case-insensitive partial match against any of the three name columns
 * (plus the legacy display name), deduped per student.
 */
export async function searchStudents(query: string): Promise<Student[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const seedHits = fromSeed(trimmed);

  // PostgREST or() syntax breaks on these characters; names never need them.
  const term = trimmed.replace(/[,()%]/g, "");
  const tokens = searchTokens(term);
  if (!term || tokens.length === 0) return seedHits;

  try {
    const supabase = getSupabaseClient();
    const columns = [
      "preferred_name",
      "official_name",
      "family_name",
      "name",
    ] as const;
    const clauses = tokens.flatMap((token) =>
      columns.map((column) => `${column}.ilike.%${token}%`),
    );
    const { data, error } = await supabase
      .from("students")
      .select("id, name, grade, comp_seats, preferred_name, official_name, family_name")
      .or(clauses.join(","))
      .limit(200);
    if (error || !data?.length) return seedHits;

    const students = new Map<string, Student>();
    for (const row of data as StudentRow[]) {
      if (!students.has(row.id)) students.set(row.id, fromRow(row));
    }
    return [...students.values()];
  } catch {
    return seedHits;
  }
}

/**
 * The one student a typed name unambiguously identifies, or null.
 * (Two students can share a preferred name — e.g. two Anastasias —
 * so an ambiguous hit selects nobody and the dropdown stays open.)
 */
export async function matchStudent(query: string): Promise<Student | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const rows = await searchStudents(trimmed);
  const hits = rows.filter((row) => studentMatchesExact(row, trimmed));
  return hits.length === 1 ? hits[0] : null;
}
