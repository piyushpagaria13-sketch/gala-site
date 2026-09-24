"use client";

import { useEffect, useState } from "react";
import { useBookingDraft } from "@/lib/bookingDraft";

/**
 * Step 1 — student name. A plain text field: no suggestions. Continue is
 * enabled as soon as anything is typed, and validation happens on Continue
 * (see ContinueButton): an exact match against the complimentary-ticket
 * list — preferred or official name, family name optional — gets the free
 * tickets and the explanation dialog; any other name books normally.
 */
export function StudentSearch() {
  const { draft, setDraft, setStepValid } = useBookingDraft();
  const [name, setName] = useState(draft.student?.name ?? "");
  const [phone, setPhone] = useState(draft.contact?.phone ?? "");

  useEffect(() => {
    setStepValid(Boolean(name.trim() && phone.trim()));
  }, [name, phone, setStepValid]);

  const handleNameChange = (value: string) => {
    setName(value);
    const trimmed = value.trim();
    setDraft({
      ...draft,
      student: trimmed
        ? { ...(draft.student ?? { id: "", compSeats: 0 }), name: trimmed }
        : null,
      contact: { ...draft.contact, phone },
    });
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setDraft({
      ...draft,
      student: name.trim()
        ? { ...(draft.student ?? { id: "", compSeats: 0 }), name: name.trim() }
        : draft.student,
      contact: { ...draft.contact, phone: value },
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
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Start typing a name"
          autoComplete="off"
          className="w-full rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-[18px] py-4 text-[17px] text-[#e3c46a] outline-none placeholder:text-[#77633a] focus:border-gold"
        />
      </div>

      <div className="relative mt-5 flex w-full flex-col gap-2">
        <label htmlFor="student-phone" className="text-[13px] text-[#9a7f3e]">
          Add Phone Number
        </label>
        <input
          id="student-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="+65"
          autoComplete="tel"
          className="w-full rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-[18px] py-4 text-[17px] text-[#e3c46a] outline-none placeholder:text-[#77633a] focus:border-gold"
        />
        <p className="text-[13px] leading-[1.5] text-[#77633a]">
          Bookings are made under the graduating student&apos;s name.
        </p>
      </div>
    </div>
  );
}
