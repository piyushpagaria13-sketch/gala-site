/** Booking-received auto-reply copy. No local imports so node:test can load this. */

export type BookingReceivedInput = {
  ref: string;
  tableNo: number;
  partySize: number;
  guests: string[];
};

export function bookingReceivedSubject(): string {
  return "We've received your booking request! (Pending Confirmation)";
}

export function bookingReceivedText(_input?: BookingReceivedInput): string {
  return [
    "Thank you for your booking for the Graduation Gala Dinner 2027.",
    "We wanted to let you know that we have successfully received your request for the Gala Dinner on 22 May at 7:30!",
    "",
    "",
    "Look out for another email with confirmation of your tickets once the payment screenshots have been verified by our team.",
    "",
    "Regards",
    "The graduation committee",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bookingReceivedHtml(input?: BookingReceivedInput): string {
  const body = escapeHtml(bookingReceivedText(input)).replaceAll("\n", "<br>");
  return `<div style="background:#0b1526;color:#e8d9a8;font-family:Georgia,serif;padding:32px;"><p style="color:#d4af37;">${body}</p></div>`;
}
