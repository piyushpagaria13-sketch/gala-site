"use client";

import Image from "next/image";

/** Quantity stepper — minus / value / plus, styled per the parking & bus dialogs. */
export function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center overflow-clip rounded-[10px] border border-[#6e5a2b]">
      {/* The exported assets are the full 48×44 button cell with the glyph centered. */}
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="h-[44px] w-[48px] transition-opacity disabled:opacity-35"
      >
        <Image src="/book/icon-stepper-minus.svg" alt="" width={48} height={44} />
      </button>
      <span className="flex h-[44px] w-[64px] items-center justify-center text-[17px] text-[#e8d9a8]">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="h-[44px] w-[48px] transition-opacity disabled:opacity-35"
      >
        <Image src="/book/icon-stepper-plus.svg" alt="" width={48} height={44} />
      </button>
    </div>
  );
}
