import QRCode from "qrcode";
import { REMINDER_DEADLINE_HOURS } from "@/lib/config";
import {
  reminderText,
  ticketHtml,
  type AdminBooking,
} from "@/lib/adminRules";

async function sendResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email isn't set up yet");
  const from =
    process.env.BOOKING_EMAIL_FROM ?? "Gala Booking <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!response.ok) throw new Error("Couldn't send that email");
}

export async function sendTicketEmail(booking: AdminBooking): Promise<void> {
  const qr = await QRCode.toDataURL(booking.ref, { margin: 1, width: 240 });
  const html = ticketHtml(booking, qr);
  await sendResend({
    to: booking.email,
    subject: `Your gala ticket ${booking.ref}`,
    html,
    text: `Your ticket ${booking.ref}. Table ${booking.tableNo}. Saturday 22 May 2027 · Fairmont Ballroom Raffles City.`,
  });
}

export async function sendReminderEmail(booking: AdminBooking): Promise<void> {
  const text = reminderText(booking, REMINDER_DEADLINE_HOURS);
  await sendResend({
    to: booking.email,
    subject: `Payment reminder ${booking.ref}`,
    html: `<div style="background:#0b1526;color:#e8d9a8;font-family:Georgia,serif;padding:32px;"><p style="color:#d4af37;">${text.replaceAll("\n", "<br>")}</p></div>`,
    text,
  });
}
