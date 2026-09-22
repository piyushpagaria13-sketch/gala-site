import { getSupabaseClient } from "./supabase";
import type { Student } from "@/lib/types";

/** Local roster so name matching works even before the SQL seed is applied. */
export const SEED_STUDENTS: Student[] = [
  { id: "local:aryan-tan", name: "Aryan Tan", grade: "12", compSeats: 2 },
  { id: "local:aryan-mehta", name: "Aryan Mehta", grade: "12", compSeats: 2 },
  { id: "local:mei-ling-wong", name: "Mei Ling Wong", grade: "12", compSeats: 2 },
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

export function sameStudentName(a: string, b: string) {
  return normalize(a) === normalize(b);
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
  return SEED_STUDENTS.filter((student) =>
    student.name.toLowerCase().includes(q),
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
  if (!term) return seedHits;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("students")
      .select("id, name, grade, comp_seats, preferred_name, official_name, family_name")
      .or(
        [
          `preferred_name.ilike.%${term}%`,
          `official_name.ilike.%${term}%`,
          `family_name.ilike.%${term}%`,
          `name.ilike.%${term}%`,
        ].join(","),
      )
      .limit(8);
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
 * Exact (case/whitespace-insensitive) match on the given and family
 * names, without requiring the family name: preferred name, official
 * name, or either followed by the family name all count.
 */
export function studentMatchesExact(student: Student, query: string): boolean {
  const forms = [
    student.name,
    student.preferredName,
    student.officialName,
    student.officialName && `${student.officialName} ${student.familyName ?? ""}`,
    student.preferredName && `${student.preferredName} ${student.familyName ?? ""}`,
  ];
  return forms.some((form) => form && sameStudentName(form, query));
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
