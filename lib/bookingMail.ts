/**
 * Sends the booking-copy email. No local imports, so tests can load this file.
 * Delivery uses Resend when RESEND_API_KEY is set.
 */

export type BookingCopy = {
  to: string;
  ref: string;
  tableNo: number;
  guests: string[];
};

export function bookingCopyText(copy: BookingCopy): string {
  const names = copy.guests.filter(Boolean).join(", ");
  return [
    "You're booked for the UWCSEA Dover Graduation Gala Dinner.",
    "",
    `Reference: ${copy.ref}`,
    `Table: ${copy.tableNo}`,
    names ? `Guests: ${names}` : "",
    "",
    "Please share your payment screenshot on +6598193518 to receive the ticket.",
  ].join("\n");
}

export async function deliverBookingCopy(copy: BookingCopy): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email isn't set up yet");

  const from =
    process.env.BOOKING_EMAIL_FROM ??
    "Gala Booking <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [copy.to],
      subject: `Your gala booking ${copy.ref}`,
      text: bookingCopyText(copy),
    }),
  });

  if (!response.ok) {
    throw new Error("Couldn't send that email");
  }
}
