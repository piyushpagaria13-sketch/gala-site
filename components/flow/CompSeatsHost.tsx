"use client";

import { CompSeatsModal } from "@/components/flow/CompSeatsModal";
import { useBookingDraft } from "@/lib/bookingDraft";

export function CompSeatsHost() {
  const { compModalOpen, closeCompModal } = useBookingDraft();
  return (
    <CompSeatsModal open={compModalOpen} onContinue={closeCompModal} />
  );
}
