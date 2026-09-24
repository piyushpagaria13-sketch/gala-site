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
    return { confirm: false, remind: false, cancel: true, dimmed: false };
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

export function reminderText(booking: AdminBooking, hours: number): string {
  return [
    `We haven't been able to match a payment for ${booking.ref} yet. To keep your seats at Table ${booking.tableNo}, please complete payment within ${hours} hours.`,
    "",
    `PayNow reference: ${booking.ref}`,
    `Amount: S$${booking.amount}`,
    "Share a screenshot of the transfer on +6598193518.",
    "",
    "Already paid? Reply with a screenshot and we'll sort it out.",
  ].join("\n");
}

export function cancellationText(booking: AdminBooking): string {
  const lines = [
    `${booking.ref} has been cancelled.`,
    `The ${booking.partySize} seats at Table ${booking.tableNo} have been released and are available for other families to book.`,
  ];
  if (booking.status === "paid") lines.push("", REFUND_NOTE);
  return lines.join("\n");
}

export function ticketHtml(booking: AdminBooking, qrDataUrl: string): string {
  const names = booking.guests
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((guest) => guest.name)
    .filter(Boolean)
    .join(", ");
  return `<!doctype html>
<html>
<body style="margin:0;background:#0b1526;color:#e8d9a8;font-family:Georgia,serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <p style="letter-spacing:2px;font-size:12px;color:#d4af37;">UWCSEA DOVER · CLASS OF 2027</p>
    <h1 style="color:#d4af37;font-weight:500;">Your gala ticket</h1>
    <p style="font-size:18px;color:#e3c46a;">${booking.ref}</p>
    <p>Table ${booking.tableNo}</p>
    <p>${names}</p>
    <p>Saturday 22 May 2027 · Fairmont Ballroom, Raffles City</p>
    <img alt="QR code for ${booking.ref}" src="${qrDataUrl}" width="220" height="220" style="background:#fff;padding:8px;border-radius:12px;" />
  </div>
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
