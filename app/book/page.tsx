"use client";

import { BookingType } from "@/components/flow/BookingType";
import { ConfirmationScreen } from "@/components/flow/ConfirmationScreen";
import { GuestGrid } from "@/components/flow/GuestGrid";
import { PayNowScreen } from "@/components/flow/PayNowScreen";
import { ReviewScreen } from "@/components/flow/ReviewScreen";
import { StudentSearch } from "@/components/flow/StudentSearch";
import { TableMap } from "@/components/flow/TableMap";
import { useBookingDraft } from "@/lib/bookingDraft";

export default function BookPage() {
  const { step } = useBookingDraft();

  // Step router — one decision per screen.
  switch (step) {
    case "type":
      return <BookingType />;
    case "table":
      return <TableMap />;
    case "guests":
      return <GuestGrid />;
    case "review":
      return <ReviewScreen />;
    case "pay":
      return <PayNowScreen />;
    case "done":
      return <ConfirmationScreen />;
    case "student":
    default:
      return <StudentSearch />;
  }
}
