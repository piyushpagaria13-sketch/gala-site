"use client";

import { useState } from "react";
import { useBookingDraft } from "@/lib/bookingDraft";

/**
 * Step 1 — student name. Figma frame "D1a · Student name — empty (dark)"
 * (252:15).
 * TODO: search the students table and select-to-validate (matched state);
 * fallback to free text + grade dropdown if the students table is empty.
 */
export function StudentSearch() {
  const { draft, setDraft, setStepValid } = useBookingDraft();
  const [name, setName] = useState(draft.student?.name ?? "");
  const [isAdult, setIsAdult] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    const trimmed = value.trim();
    // TODO: require a validated match from the students table instead of
    // any non-empty name once search is wired up.
    setDraft({
      ...draft,
      student: trimmed ? { id: "", name: trimmed } : null,
    });
    setStepValid(trimmed.length > 0);
  };

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center px-4 pt-[120px]">
      <p className="text-[13px] font-medium tracking-[2.34px] text-[#9a7f3e]">
        CLASS OF 2027 GALA
      </p>
      <h1 className="mt-[18px] text-center font-display text-[28px] font-medium leading-[1.3] text-[#e3c46a] sm:text-[32px]">
        Whose graduation are you celebrating?
      </h1>

      <div className="mt-11 flex w-full flex-col gap-2">
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
        <p className="text-[13px] leading-[1.5] text-[#77633a]">
          Bookings are made under the graduating student&apos;s name.
        </p>
      </div>

      <div className="mt-6 flex w-full items-center justify-between gap-4 rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-[18px] py-4">
        <label
          htmlFor="student-adult"
          className="text-[15px] leading-[1.4] text-[#e3c46a]"
        >
          Will the student be 18 years old by May 22, 2027?
        </label>
        {/* TODO: store in booking draft alongside the selected student */}
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
