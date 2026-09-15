"use client";

import { useBookingDraft } from "@/lib/bookingDraft";
import { TABLE_CAPACITY } from "@/lib/floorplan";

/**
 * Center breadcrumb in the flow header. On the table-map step:
 * "3 seats · Aryan Tan", becoming "Table 12 · 3 seats · Aryan Tan" once a
 * table is chosen. On the guest-details step: "Table 12 · 3 seats".
 */
export function FlowBreadcrumb() {
  const { step, draft } = useBookingDraft();

  if (step === "student" || step === "type" || step === "done") return null;

  const student = draft.student?.name ?? "";
  const seats =
    draft.type === "table"
      ? TABLE_CAPACITY
      : (draft.partySize ?? TABLE_CAPACITY);
  const label =
    step === "review"
      ? "Review your booking"
      : step === "guests" || step === "pay"
        ? `Table ${draft.tableNo} · ${seats} seats`
        : draft.tableNo !== null
          ? `Table ${draft.tableNo} · ${seats} seats · ${student}`
          : `${seats} seats · ${student}`;

  return (
    <span className="pointer-events-none absolute inset-x-0 top-[26px] flex h-[44px] items-center justify-center px-24 text-center text-[13px] font-medium text-[#9a7f3e]">
      {label}
    </span>
  );
}
