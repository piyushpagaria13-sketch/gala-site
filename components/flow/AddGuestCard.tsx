"use client";

import Image from "next/image";

/** Dashed gold "Add guest" card — hidden by the grid once the party is full. */
export function AddGuestCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex h-[260px] w-full flex-col items-center justify-center gap-[10px] rounded-card border-[1.5px] border-dashed border-[#8a6f35] transition-colors hover:border-gold"
    >
      <Image src="/book/icon-add-guest.svg" alt="" width={48} height={48} />
      <span className="text-[16px] font-medium text-gold">Add guest</span>
    </button>
  );
}
