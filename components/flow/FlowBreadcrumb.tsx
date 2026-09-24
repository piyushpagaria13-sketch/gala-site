"use client";

import { partySeatCount, useBookingDraft } from "@/lib/bookingDraft";

/**
 * Center breadcrumb in the flow header. On the table-map step:
 * "3 seats · Aryan Tan", becoming "Table 12 · 3 seats · Aryan Tan" once a
 * table is chosen. On the guest-details step: "Table 12 · 3 seats".
 */
export function FlowBreadcrumb() {
  const { step, draft } = useBookingDraft();

  if (step === "student" || step === "type" || step === "done") return null;

  const student = draft.student?.name ?? "";
  const seats = partySeatCount(draft);
  const seatLabel = `${seats} ${seats === 1 ? "seat" : "seats"}`;
  const label =
    step === "review"
      ? "Review your booking"
      : step === "guests" || step === "pay"
        ? `Table ${draft.tableNo} · ${seatLabel}`
        : draft.tableNo !== null
          ? `Table ${draft.tableNo} · ${seatLabel} · ${student}`
          : `${seatLabel} · ${student}`;

  return (
    <span className="pointer-events-none absolute inset-x-0 top-[26px] flex h-[44px] items-center justify-center px-24 text-center text-[13px] font-medium text-[#9a7f3e]">
      {label}
    </span>
  );
}
