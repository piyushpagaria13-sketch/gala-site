import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  emailFooterHtml,
  emailFooterText,
  PA_CONTACT_EMAIL,
  SEAT_NUMBERS_ON_TICKETS,
  SENDER_ADDRESS,
} from "@/lib/config";
import { buildTicketPdf, ticketPdfFilename } from "@/lib/ticketPdf";
import {
  cancellationText,
  reminderText,
  TICKET_LOGO_CID,
  ticketHtml,
  ticketSubject,
  ticketText,
  type AdminBooking,
} from "@/lib/adminRules";
import {
  bookingReceivedHtml,
  bookingReceivedSubject,
  bookingReceivedText,
} from "@/lib/bookingReceived";

function withFooter(
  html: string,
  text: string,
  htmlFooter = true,
): { html: string; text: string } {
  const textOut = `${text}\n\n${emailFooterText()}`;
  if (!htmlFooter) return { html, text: textOut };
  const footer = emailFooterHtml();
  const themed = html.includes("</div>")
    ? html.replace("</div>", `${footer}</div>`)
    : `${html}${footer}`;
  return { html: themed, text: textOut };
}

async function sendResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  htmlFooter?: boolean;
  attachments?: {
    filename: string;
    content: string;
    content_type?: string;
    content_id?: string;
  }[];
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email isn't set up yet");
  const body = withFooter(input.html, input.text, input.htmlFooter);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER_ADDRESS,
      reply_to: PA_CONTACT_EMAIL,
      to: [input.to],
      subject: input.subject,
      html: body.html,
      text: body.text,
      attachments: input.attachments,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail.slice(0, 180) || "Couldn't send that email");
  }
}

async function ticketLogoAttachment(): Promise<{
  filename: string;
  content: string;
  content_type: string;
  content_id: string;
}> {
  const bytes = await readFile(
    path.join(process.cwd(), "public", "uwcsea-logo.png"),
  );
  return {
    filename: "uwcsea-logo.png",
    content: Buffer.from(bytes).toString("base64"),
    content_type: "image/png",
    content_id: TICKET_LOGO_CID,
  };
}

export async function sendTicketEmail(booking: AdminBooking): Promise<void> {
  const html = ticketHtml(booking);
  const [pdf, logo] = await Promise.all([
    buildTicketPdf({
      ref: booking.ref,
      tableNo: booking.tableNo,
      partySize: booking.partySize,
      guests: booking.guests,
      seatNumbers: SEAT_NUMBERS_ON_TICKETS,
    }),
    ticketLogoAttachment(),
  ]);
  await sendResend({
    to: booking.email,
    subject: ticketSubject(booking),
    html,
    text: ticketText(booking),
    htmlFooter: false,
    attachments: [
      logo,
      {
        filename: ticketPdfFilename(booking.ref),
        content: Buffer.from(pdf).toString("base64"),
        content_type: "application/pdf",
      },
    ],
  });
}

export async function sendReminderEmail(booking: AdminBooking): Promise<void> {
  const text = reminderText();
  await sendResend({
    to: booking.email,
    subject: `Payment reminder ${booking.ref}`,
    html: `<div style="background:#0b1526;color:#e8d9a8;font-family:Georgia,serif;padding:32px;"><p style="color:#d4af37;">${text.replaceAll("\n", "<br>")}</p></div>`,
    text,
  });
}

export async function sendCancellationEmail(booking: AdminBooking): Promise<void> {
  const text = cancellationText();
  await sendResend({
    to: booking.email,
    subject: `Booking cancelled ${booking.ref}`,
    html: `<div style="background:#0b1526;color:#e8d9a8;font-family:Georgia,serif;padding:32px;"><p style="color:#d4af37;">${text.replaceAll("\n", "<br>")}</p></div>`,
    text,
  });
}

export async function sendBookingReceivedEmail(input: {
  to: string;
  ref: string;
  tableNo: number;
  partySize: number;
  guests: string[];
}): Promise<void> {
  const payload = {
    ref: input.ref,
    tableNo: input.tableNo,
    partySize: input.partySize,
    guests: input.guests,
  };
  await sendResend({
    to: input.to,
    subject: bookingReceivedSubject(),
    html: bookingReceivedHtml(payload),
    text: bookingReceivedText(payload),
  });
}
