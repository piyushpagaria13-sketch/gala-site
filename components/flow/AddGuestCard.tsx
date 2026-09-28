"use client";

import Image from "next/image";

/** Dashed gold add card — sits above Continue so it stays on screen. */
export function AddGuestCard({
  onAdd,
  label = "Add another guest",
  disabled = false,
}: {
  onAdd: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className={`flex h-[72px] w-full items-center justify-center gap-[10px] rounded-card border-[1.5px] border-dashed border-[#8a6f35] transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-[0.35]"
          : "hover:border-gold"
      }`}
    >
      <Image src="/book/icon-add-guest.svg" alt="" width={28} height={28} />
      <span className="text-[16px] font-medium text-gold">{label}</span>
    </button>
  );
}
