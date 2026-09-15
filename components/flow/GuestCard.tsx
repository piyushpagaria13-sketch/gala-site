"use client";

import Image from "next/image";
import { useId } from "react";
import type { Guest } from "@/lib/types";

/**
 * One attendee card on the "Who's coming?" grid — Name, Age and a Dietary
 * restriction select. The student card carries a GRADUATE badge and a darker
 * name field (prefilled from the first step).
 */

export const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-free",
  "Other",
];

const FIELD =
  "w-full rounded-[10px] border border-[#6e5a2b] px-[14px] py-3 text-[15px] text-[#e8d9a8] outline-none transition-colors placeholder:text-[#77633a] focus:border-gold";

type GuestCardProps = {
  /** "Student" or "Guest N". */
  title: string;
  /** Optional pill next to the title (e.g. "GRADUATE" on the student card). */
  badge?: string;
  guest: Guest;
  onChange: (next: Guest) => void;
  /** Remove this card. Omitted on the student card — the graduate can't be deleted. */
  onDelete?: () => void;
};

export function GuestCard({
  title,
  badge,
  guest,
  onChange,
  onDelete,
}: GuestCardProps) {
  const id = useId();

  return (
    <div className="rounded-card border border-[#6e5a2b] bg-[#1a1610] px-5 pb-[22px] pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <p className="text-[16px] font-medium text-[#e8d9a8]">{title}</p>
          {badge && (
            <span className="rounded-pill bg-[#3a2f18] px-[10px] py-[3px] text-[11px] font-medium tracking-[0.88px] text-[#c9a648]">
              {badge}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            aria-label={`Remove ${title}`}
            onClick={onDelete}
            className="-m-1 p-1 text-[#9a7f3e] transition-colors hover:text-[#e0937d]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M2.5 4h11M6.5 4V2.75c0-.4.34-.75.75-.75h1.5c.41 0 .75.35.75.75V4M4 4l.7 9.1c.05.5.47.9.98.9h4.64c.5 0 .93-.4.97-.9L12 4M6.5 7v4M9.5 7v4" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-[14px] flex flex-col gap-[6px]">
        <label className="text-[12px] text-[#9a7f3e]" htmlFor={`${id}-name`}>
          Name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          value={guest.name}
          placeholder="Full name"
          onChange={(e) => onChange({ ...guest, name: e.target.value })}
          className={`${FIELD} ${badge ? "bg-[#131008]" : "bg-[#1a1610]"}`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-[6px]">
        <label className="text-[12px] text-[#9a7f3e]" htmlFor={`${id}-age`}>
          Age
        </label>
        <input
          id={`${id}-age`}
          type="text"
          inputMode="numeric"
          value={guest.age ?? ""}
          placeholder="—"
          onChange={(e) =>
            onChange({
              ...guest,
              age: e.target.value.replace(/\D/g, "").slice(0, 3),
            })
          }
          className={`${FIELD} bg-[#1a1610]`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-[6px]">
        <label className="text-[12px] text-[#9a7f3e]" htmlFor={`${id}-diet`}>
          Dietary restriction
        </label>
        <div className="relative">
          <select
            id={`${id}-diet`}
            value={guest.dietary ?? ""}
            onChange={(e) => onChange({ ...guest, dietary: e.target.value })}
            className={`${FIELD} appearance-none bg-[#1a1610] pr-9 ${
              guest.dietary ? "text-[#e8d9a8]" : "text-[#77633a]"
            }`}
          >
            <option value="" disabled>
              Select
            </option>
            {DIETARY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Image
            src="/book/icon-select-down.svg"
            alt=""
            width={10}
            height={6}
            className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2"
          />
        </div>
      </div>
    </div>
  );
}
