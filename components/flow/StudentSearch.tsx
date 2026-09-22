"use client";

import { useEffect, useRef, useState } from "react";
import { useBookingDraft } from "@/lib/bookingDraft";
import { searchStudents, sameStudentName } from "@/lib/students";
import type { Student } from "@/lib/types";

const COMP_NOTE =
  "This booking includes 2 complimentary seats — the graduate's and one guest's, courtesy of the PA.";

function namesMatch(a: string, b: string) {
  return sameStudentName(a, b);
}

/**
 * Step 1 — student name. Continue is enabled as soon as anything is typed.
 * After typing pauses, the name is checked against the students table.
 */
export function StudentSearch() {
  const {
    draft,
    setDraft,
    setStepValid,
    compModalSeenIds,
    markCompModalSeen,
    openCompModal,
  } = useBookingDraft();
  const [name, setName] = useState(draft.student?.name ?? "");
  const [isAdult, setIsAdult] = useState(false);
  const [matches, setMatches] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const selected = draft.student;

  useEffect(() => {
    setStepValid(Boolean(name.trim()));
  }, [name, setStepValid]);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMatches([]);
      setOpen(false);
      return;
    }
    if (selected?.id && namesMatch(selected.name, trimmed)) {
      setMatches([]);
      setOpen(false);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(() => {
      searchStudents(trimmed)
        .then((rows) => {
          if (requestId.current !== id) return;
          const exact = rows.find((row) => namesMatch(row.name, trimmed));
          if (exact) {
            setDraft({ ...draftRef.current, student: exact });
            setMatches([]);
            setOpen(false);
            if (
              exact.compSeats > 0 &&
              !compModalSeenIds.includes(exact.id)
            ) {
              markCompModalSeen(exact.id);
              openCompModal(false);
            }
            return;
          }
          setMatches(rows);
          setOpen(rows.length > 0);
        })
        .catch(() => {
          if (requestId.current !== id) return;
          setMatches([]);
          setOpen(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [name, selected, setDraft, compModalSeenIds, markCompModalSeen, openCompModal]);

  const handleNameChange = (value: string) => {
    setName(value);
    const trimmed = value.trim();
    setStepValid(trimmed.length > 0);
    const keepMatch =
      selected?.id && trimmed && namesMatch(selected.name, trimmed);
    setDraft({
      ...draft,
      student: trimmed
        ? keepMatch
          ? { ...selected, name: trimmed }
          : { id: "", name: trimmed, compSeats: 0 }
        : null,
    });
  };

  const handleSelect = (student: Student) => {
    setName(student.name);
    setDraft({ ...draft, student });
    setMatches([]);
    setOpen(false);
    setStepValid(true);
    if (student.compSeats > 0 && !compModalSeenIds.includes(student.id)) {
      markCompModalSeen(student.id);
      openCompModal(false);
    }
  };

  const showCompNote = (selected?.compSeats ?? 0) > 0;

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center px-4 pt-[120px]">
      <p className="text-[13px] font-medium tracking-[2.34px] text-[#9a7f3e]">
        CLASS OF 2027 GALA
      </p>
      <h1 className="mt-[18px] text-center font-display text-[28px] font-medium leading-[1.3] text-[#e3c46a] sm:text-[32px]">
        Whose graduation are you celebrating?
      </h1>

      <div className="relative mt-11 flex w-full flex-col gap-2">
        <label htmlFor="student-name" className="text-[13px] text-[#9a7f3e]">
          Student name
        </label>
        <input
          id="student-name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Start typing a name"
          autoComplete="off"
          className="w-full rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-[18px] py-4 text-[17px] text-[#e3c46a] outline-none placeholder:text-[#77633a] focus:border-gold"
        />
        {open && (
          <ul
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] py-1 shadow-xl"
            role="listbox"
          >
            {matches.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-[18px] py-3 text-left text-[16px] text-[#e3c46a] hover:bg-[#241a06]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(student)}
                >
                  {student.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[13px] leading-[1.5] text-[#77633a]">
          Bookings are made under the graduating student&apos;s name.
        </p>
        {showCompNote && (
          <p className="rounded-[10px] border border-gold/40 bg-[#241a06] px-3 py-2.5 text-[13px] leading-[1.5] text-gold">
            {COMP_NOTE}
          </p>
        )}
      </div>

      <div className="mt-6 flex w-full items-center justify-between gap-4 rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-[18px] py-4">
        <label
          htmlFor="student-adult"
          className="text-[15px] leading-[1.4] text-[#e3c46a]"
        >
          Will the student be 18 years old by May 22, 2027?
        </label>
        <button
          id="student-adult"
          type="button"
          role="switch"
          aria-checked={isAdult}
          onClick={() => setIsAdult(!isAdult)}
          className={`relative h-[31px] w-[51px] shrink-0 rounded-pill transition-colors duration-200 ${
            isAdult ? "bg-[#34c759]" : "bg-[#39322a]"
          }`}
        >
          <span
            className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-pill bg-white shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-transform duration-200 ${
              isAdult ? "translate-x-[20px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
