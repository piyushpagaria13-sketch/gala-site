"use client";

import { useEffect, useRef, useState } from "react";
import { useBookingDraft } from "@/lib/bookingDraft";
import { emailLooksInvalid, isValidEmail } from "@/lib/email";
import { isValidSingaporePhone, singaporePhoneTooLong } from "@/lib/phone";
import { sameStudentName, searchStudents } from "@/lib/students";
import type { Student } from "@/lib/types";

/**
 * Step 1 — student name. Suggestions come from the class list as you type.
 * Continue stays on once name, phone, and email are filled. An exact match is
 * resolved on Continue.
 */
export function StudentSearch() {
  const { draft, setDraft, setStepValid } = useBookingDraft();
  const [name, setName] = useState(draft.student?.name ?? "");
  const [phone, setPhone] = useState(draft.contact?.phone ?? "");
  const [email, setEmail] = useState(draft.contact?.email ?? "");
  const [matches, setMatches] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  const phoneTooLong = singaporePhoneTooLong(phone);
  const emailInvalid = emailLooksInvalid(email);

  useEffect(() => {
    setStepValid(
      Boolean(
        name.trim() && isValidSingaporePhone(phone) && isValidEmail(email),
      ),
    );
  }, [name, phone, email, setStepValid]);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMatches([]);
      setOpen(false);
      return;
    }
    if (draft.student?.id && sameStudentName(draft.student.name, trimmed)) {
      setMatches([]);
      setOpen(false);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(() => {
      searchStudents(trimmed)
        .then((rows) => {
          if (requestId.current !== id) return;
          const q = trimmed.toLowerCase();
          const ranked = rows
            .slice()
            .sort((a, b) => rankName(a, q) - rankName(b, q))
            .slice(0, 8);
          setMatches(ranked);
          setOpen(ranked.length > 0);
        })
        .catch(() => {
          if (requestId.current !== id) return;
          setMatches([]);
          setOpen(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [name, draft.student]);

  const handleNameChange = (value: string) => {
    setName(value);
    const trimmed = value.trim();
    const keep =
      draft.student?.id && trimmed && sameStudentName(draft.student.name, trimmed);
    setDraft({
      ...draft,
      student: trimmed
        ? keep
          ? { ...draft.student!, name: trimmed }
          : { id: "", name: trimmed, compSeats: 0 }
        : null,
      contact: { ...draft.contact, phone, email },
    });
  };

  const handleSelect = (student: Student) => {
    setName(student.name);
    setDraft({
      ...draft,
      student,
      contact: { ...draft.contact, phone, email },
    });
    setMatches([]);
    setOpen(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setDraft({
      ...draft,
      student: name.trim()
        ? { ...(draft.student ?? { id: "", compSeats: 0 }), name: name.trim() }
        : draft.student,
      contact: { ...draft.contact, phone: value, email },
    });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setDraft({
      ...draft,
      student: name.trim()
        ? { ...(draft.student ?? { id: "", compSeats: 0 }), name: name.trim() }
        : draft.student,
      contact: { ...draft.contact, phone, email: value },
    });
  };

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
          role="combobox"
          aria-expanded={open}
          aria-controls="student-suggestions"
          aria-autocomplete="list"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => setOpen(false)}
          placeholder="Start typing a name"
          autoComplete="off"
          className="w-full rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-[18px] py-4 text-[17px] text-[#e3c46a] outline-none placeholder:text-[#77633a] focus:border-gold"
        />
        {open && (
          <ul
            id="student-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-[78px] z-20 max-h-56 overflow-auto rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] py-1 shadow-xl"
          >
            {matches.map((student) => {
              const official =
                student.officialName &&
                student.preferredName &&
                !sameStudentName(student.officialName, student.preferredName)
                  ? student.officialName
                  : "";
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full flex-col px-[18px] py-3 text-left hover:bg-[#241a06]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(student)}
                  >
                    <span className="text-[16px] text-[#e3c46a]">{student.name}</span>
                    {official && (
                      <span className="text-[12px] text-[#9a7f3e]">Official: {official}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="relative mt-5 flex w-full flex-col gap-2">
        <label htmlFor="student-phone" className="text-[13px] text-[#9a7f3e]">
          Add Phone Number
        </label>
        <input
          id="student-phone"
          type="tel"
          required
          inputMode="numeric"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="+65"
          autoComplete="tel"
          aria-invalid={phoneTooLong}
          aria-describedby={phoneTooLong ? "student-phone-error" : undefined}
          className={`w-full rounded-[12px] border bg-[#1a1610] px-[18px] py-4 text-[17px] text-[#e3c46a] outline-none placeholder:text-[#77633a] ${
            phoneTooLong
              ? "border-[#e0937d] focus:border-[#e0937d]"
              : "border-[#6e5a2b] focus:border-gold"
          }`}
        />
        {phoneTooLong && (
          <p id="student-phone-error" className="text-[13px] leading-[1.5] text-[#e0937d]">
            Singapore numbers are 8 digits.
          </p>
        )}
      </div>

      <div className="relative mt-5 flex w-full flex-col gap-2">
        <label htmlFor="student-email" className="text-[13px] text-[#9a7f3e]">
          Add Email
        </label>
        <input
          id="student-email"
          type="email"
          required
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          aria-invalid={emailInvalid}
          aria-describedby={emailInvalid ? "student-email-error" : undefined}
          className={`w-full rounded-[12px] border bg-[#1a1610] px-[18px] py-4 text-[17px] text-[#e3c46a] outline-none placeholder:text-[#77633a] ${
            emailInvalid
              ? "border-[#e0937d] focus:border-[#e0937d]"
              : "border-[#6e5a2b] focus:border-gold"
          }`}
        />
        {emailInvalid && (
          <p id="student-email-error" className="text-[13px] leading-[1.5] text-[#e0937d]">
            Enter a valid email.
          </p>
        )}
        <p className="text-[13px] leading-[1.5] text-[#77633a]">
          Bookings are made under the graduating student&apos;s name.
        </p>
      </div>
    </div>
  );
}

function rankName(student: Student, query: string): number {
  const preferred = (student.preferredName ?? student.name).toLowerCase();
  const display = student.name.toLowerCase();
  if (preferred.startsWith(query) || display.startsWith(query)) return 0;
  if (preferred.includes(query) || display.includes(query)) return 1;
  return 2;
}
