/** Booking-received auto-reply copy. No local imports so node:test can load this. */

export type BookingReceivedInput = {
  ref: string;
  tableNo: number;
  partySize: number;
  guests: string[];
};

export function bookingReceivedSubject(ref: string): string {
  return `We've received your booking request — ${ref} (pending confirmation)`;
}

export function seatsLabel(partySize: number): string {
  return partySize === 1 ? "1 seat" : `${partySize} seats`;
}

export function guestNamesList(guests: string[]): string {
  return guests.map((name) => name.trim()).filter(Boolean).join(", ");
}

export function bookingReceivedText(input: BookingReceivedInput): string {
  const names = guestNamesList(input.guests);
  const seats = seatsLabel(input.partySize);
  return [
    "Thank you for your booking for the Graduation Gala Dinner 2027! We've successfully received your request for Saturday, 22 May 2027, 7:30 PM at the Fairmont Ballroom, Raffles City.",
    "",
    "Your booking",
    `Reference: ${input.ref}`,
    `Table: Table ${input.tableNo}`,
    names ? `Seats: ${seats} — ${names}` : `Seats: ${seats}`,
    "",
    "Your seats are being held. Look out for a confirmation email with your tickets once our team has verified your payment.",
    "",
    "Warm regards,",
    "The Graduation Committee",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bookingReceivedHtml(input: BookingReceivedInput): string {
  const body = escapeHtml(bookingReceivedText(input)).replaceAll("\n", "<br>");
  return `<div style="background:#0b1526;color:#e8d9a8;font-family:Georgia,serif;padding:32px;"><p style="color:#d4af37;">${body}</p></div>`;
}
