/**
 * Guest-facing confirmation screen. Complimentary bookings are reserved
 * without payment, so they must not read as PAID. No local imports so
 * node:test can load this file.
 */

export type ConfirmationTone = "complimentary" | "paid" | "pending";

export function isFullyComplimentary(compSeats: number, amount: number): boolean {
  return compSeats > 0 && amount === 0;
}

export function confirmationTone(input: {
  compSeats: number;
  amount: number;
  bookingStatus: string | null;
}): ConfirmationTone {
  if (isFullyComplimentary(input.compSeats, input.amount)) {
    return "complimentary";
  }
  if (input.bookingStatus === "paid") return "paid";
  return "pending";
}

export function confirmationSubtitle(tone: ConfirmationTone): string {
  if (tone === "complimentary") {
    return "Your seats are reserved. Your tickets are confirmed.";
  }
  if (tone === "paid") {
    return "Your seats are reserved. No payment is due.";
  }
  return "Your seats are reserved. Payment will be verified by your Grade Rep.";
}

export function confirmationBadge(tone: ConfirmationTone): string {
  if (tone === "complimentary") return "CONFIRM";
  if (tone === "paid") return "PAID";
  return "PAYMENT PENDING";
}

export function reviewCtaLabel(payable: number): string {
  return payable <= 0 ? "Confirm" : "Confirm & pay";
}

export function showPaymentProofBanner(tone: ConfirmationTone): boolean {
  return tone !== "complimentary";
}

export function complimentaryTicketNote(): string {
  return "The PA will email your e-tickets.";
}
