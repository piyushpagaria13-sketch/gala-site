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
};

export function sameStudentName(a: string, b: string) {
  return (
    a.trim().replace(/\s+/g, " ").toLowerCase() ===
    b.trim().replace(/\s+/g, " ").toLowerCase()
  );
}

function fromSeed(query: string): Student[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEED_STUDENTS.filter((student) =>
    student.name.toLowerCase().includes(q),
  );
}

function fromRow(row: StudentRow): Student {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade ?? undefined,
    compSeats: row.comp_seats ?? 0,
  };
}

export async function searchStudents(query: string): Promise<Student[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const seedHits = fromSeed(trimmed);

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("students")
      .select("id, name, grade, comp_seats")
      .ilike("name", `%${trimmed}%`)
      .limit(8);
    if (error || !data?.length) return seedHits;
    return (data as StudentRow[]).map(fromRow);
  } catch {
    return seedHits;
  }
}

export async function matchStudent(query: string): Promise<Student | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const rows = await searchStudents(trimmed);
  return rows.find((row) => sameStudentName(row.name, trimmed)) ?? null;
}
