/** Admin booking rules. No local imports, so node:test can load this file. */

export type AdminStatus =
  | "awaiting_payment"
  | "claims_paid"
  | "paid"
  | "cancelled";

export type AdminGuest = {
  name: string;
  age: string;
  dietary: string;
  allergyNote: string;
  sortOrder: number;
};

export type AdminBooking = {
  id: string;
  ref: string;
  status: AdminStatus;
  tableNo: number;
  partySize: number;
  cars: number;
  busSeats: number;
  contact: string;
  email: string;
  amount: number;
  createdAt: string;
  ticketSentAt: string | null;
  reminderSentAt: string | null;
  cancelledAt: string | null;
  studentName: string;
  compSeats: number;
  guests: AdminGuest[];
};

export type ButtonState = {
  confirm: boolean;
  remind: boolean;
  cancel: boolean;
  dimmed: boolean;
};

export const REFUND_NOTE =
  "This booking was already paid — arrange the refund manually; cancelling here doesn't move money.";

export function buttonState(status: AdminStatus): ButtonState {
  if (status === "cancelled") {
    return { confirm: false, remind: false, cancel: false, dimmed: true };
  }
  if (status === "paid") {
    return { confirm: false, remind: false, cancel: false, dimmed: false };
  }
  return { confirm: true, remind: true, cancel: true, dimmed: false };
}

export function guestLine(guest: AdminGuest): string {
  const bits = [guest.age, guest.dietary].filter(Boolean).join(", ");
  const base = bits ? `${guest.name} (${bits})` : guest.name;
  return guest.allergyNote ? `${base} (${guest.allergyNote})` : base;
}

export function guestSummary(guests: AdminGuest[]): string {
  return guests
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(guestLine)
    .join(" · ");
}

export function whatsAppHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function seatsFilled(
  rows: { tableNo: number; partySize: number; status: string }[],
  tableNo: number,
): number {
  return rows
    .filter((row) => row.tableNo === tableNo && row.status !== "cancelled")
    .reduce((sum, row) => sum + row.partySize, 0);
}

export function cancelCopy(booking: AdminBooking): {
  title: string;
  line: string;
  body: string;
  refundNote: string | null;
} {
  return {
    title: "Cancel this booking?",
    line: `${booking.ref} · ${booking.studentName} · ${booking.partySize} seats at Table ${booking.tableNo}`,
    body: `The ${booking.partySize} seats will be released immediately and become available for other families to book. This can't be undone — rebooking goes through the site.`,
    refundNote: booking.status === "paid" ? REFUND_NOTE : null,
  };
}

export function noEmailMessage(contact: string): string {
  return `No email on file — contact ${contact || "the guest"}`;
}

export type ConfirmPlan =
  | { type: "noop" }
  | { type: "no-email"; message: string }
  | { type: "send" };

export function planConfirm(booking: AdminBooking): ConfirmPlan {
  if (booking.ticketSentAt) return { type: "noop" };
  if (!booking.email.trim()) {
    return { type: "no-email", message: noEmailMessage(booking.contact) };
  }
  return { type: "send" };
}

export function planRemind(
  booking: AdminBooking,
): { type: "no-email"; message: string } | { type: "send" } {
  if (!booking.email.trim()) {
    return { type: "no-email", message: noEmailMessage(booking.contact) };
  }
  return { type: "send" };
}

export function reminderText(_booking?: AdminBooking, _hours?: number): string {
  return [
    "Your payment is still outstanding and your booking has NOT been confirmed yet. We will hold your tickets for next 12 hours before cancelling the reservation.",
    "",
    "If you have already paid and shared your screenshot for the proof of payment on +6598193518, please reach out to us on padovergraduation@gapps.uwcsea.edu.sg or contact your Grade Reps directly.",
  ].join("\n");
}

export function cancellationText(_booking?: AdminBooking): string {
  return "Your booking has been cancelled and the seats have been released for booking again!";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Hosted logo on the live site. Matches lib/config UWCSEA_LOGO_URL. */
export const TICKET_LOGO_URL =
  "https://galadinneruwcseadover.com/uwcsea-logo.png";

const TICKET_FOOTER_MAIL = "Padovergraduation@gapps.uwcsea.edu.sg";

function ticketFooterHtml(): string {
  return `<p style="margin-top:28px;font-size:13px;line-height:1.5;color:#9a7f3e;">This mailbox isn't monitored — for any questions about your booking, email us at <a href="mailto:${TICKET_FOOTER_MAIL}" style="color:#d4af37;">${TICKET_FOOTER_MAIL}</a> or speak to your Grade Rep.</p>`;
}

export function ticketSubject(booking: AdminBooking): string {
  return `Your tickets — ${booking.ref} · UWCSEA Dover Graduation Gala`;
}

export function ticketSummaryLine(booking: AdminBooking): string {
  return `${booking.ref} · Table ${booking.tableNo} · ${booking.partySize} seats · Saturday, 22 May 2027 · Fairmont Ballroom, Raffles City`;
}

export function ticketText(booking: AdminBooking): string {
  const name = booking.studentName.trim() || "Guest";
  return [
    `Dear ${name},`,
    "",
    "Your booking is confirmed. Your E-Tickets are attached to this email.",
    "",
    ticketSummaryLine(booking),
  ].join("\n");
}

export function ticketHtml(booking: AdminBooking): string {
  const name = escapeHtml(booking.studentName.trim() || "Guest");
  const summary = escapeHtml(ticketSummaryLine(booking));
  const footer = ticketFooterHtml();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(ticketSubject(booking))}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:600px;max-width:600px;">
          <tr>
            <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;padding:28px 32px 24px 32px;">
              <img src="${TICKET_LOGO_URL}" alt="UWCSEA" width="200" height="120" style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:120px;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#101d33" style="background-color:#101d33;padding:28px 32px;">
              <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.4;font-weight:bold;color:#ffffff;">Dear ${name},</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;font-weight:normal;color:#ffffff;">Your booking is confirmed. Your E-Tickets are attached to this email.</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f4f1ea" style="background-color:#f4f1ea;padding:20px 32px 8px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#4a4338;">${summary}</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f4f1ea" style="background-color:#f4f1ea;padding:8px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function runConfirm(
  booking: AdminBooking,
  deps: {
    now: string;
    send: () => Promise<void>;
    savePaid: (at: string) => Promise<void>;
  },
): Promise<{ booking: AdminBooking; message?: string; sent: boolean }> {
  const plan = planConfirm(booking);
  if (plan.type === "noop") return { booking, sent: false };
  if (plan.type === "no-email") {
    return { booking, message: plan.message, sent: false };
  }
  await deps.send();
  await deps.savePaid(deps.now);
  return {
    booking: { ...booking, status: "paid", ticketSentAt: deps.now },
    sent: true,
  };
}

export async function runRemind(
  booking: AdminBooking,
  deps: { now: string; send: () => Promise<void>; saveReminder: (at: string) => Promise<void> },
): Promise<{ booking: AdminBooking; message?: string; sent: boolean }> {
  const plan = planRemind(booking);
  if (plan.type === "no-email") {
    return { booking, message: plan.message, sent: false };
  }
  await deps.send();
  await deps.saveReminder(deps.now);
  return {
    booking: { ...booking, reminderSentAt: deps.now },
    sent: true,
  };
}

export async function runCancel(
  booking: AdminBooking,
  deps: {
    now: string;
    saveCancelled: (at: string) => Promise<void>;
    exportSheet: () => Promise<void>;
  },
): Promise<{ booking: AdminBooking; exportError?: string }> {
  await deps.saveCancelled(deps.now);
  let exportError: string | undefined;
  try {
    await deps.exportSheet();
  } catch (error) {
    exportError =
      error instanceof Error ? error.message : "Sheet export failed";
  }
  return {
    booking: { ...booking, status: "cancelled", cancelledAt: deps.now },
    exportError,
  };
}
