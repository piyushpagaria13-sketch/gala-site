import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { adminCookieMatches, adminGuard, passwordsMatch } from "../lib/adminAuth.ts";
import {
  REFUND_NOTE,
  buttonState,
  cancelCopy,
  cancellationText,
  planConfirm,
  planResend,
  reminderText,
  runCancel,
  runConfirm,
  runResend,
  seatsFilled,
  ticketHtml,
  ticketSubject,
  ticketSummaryLine,
  type AdminBooking,
} from "../lib/adminRules.ts";

function booking(overrides: Partial<AdminBooking> = {}): AdminBooking {
  return {
    id: "1",
    ref: "GALA-0235",
    status: "awaiting_payment",
    tableNo: 12,
    partySize: 3,
    cars: 1,
    busSeats: 2,
    contact: "+6591234567",
    email: "guest@example.com",
    amount: 654,
    createdAt: "2026-09-24T00:00:00.000Z",
    ticketSentAt: null,
    reminderSentAt: null,
    cancelledAt: null,
    studentName: "Aryan Tan",
    compSeats: 2,
    guests: [
      { name: "Aryan Tan", age: "18+", dietary: "Chicken", allergyNote: "", sortOrder: 0 },
    ],
    ...overrides,
  };
}

test("no admin cookie is the login gate and API routes reject it", () => {
  assert.equal(adminCookieMatches(undefined), false);
  assert.equal(adminCookieMatches(null), false);
  const blocked = adminGuard(undefined);
  assert.equal(blocked?.status, 401);
  assert.equal(blocked?.body.error, "unauthorized");
});

test("password check rejects a mismatch", () => {
  process.env.ADMIN_PASSWORD = "correct-horse";
  assert.equal(passwordsMatch("nope"), false);
  assert.equal(passwordsMatch("correct-horse"), true);
  assert.equal(adminGuard("not-the-token")?.status, 401);
});

test("confirm on awaiting sends once, second call is a no-op", async () => {
  let sends = 0;
  let saved = "";
  const first = await runConfirm(booking(), {
    now: "2026-09-24T01:00:00.000Z",
    send: async () => {
      sends += 1;
    },
    savePaid: async (at) => {
      saved = at;
    },
  });
  assert.equal(sends, 1);
  assert.equal(saved, "2026-09-24T01:00:00.000Z");
  assert.equal(first.booking.status, "paid");
  assert.equal(first.sent, true);

  const second = await runConfirm(first.booking, {
    now: "2026-09-24T02:00:00.000Z",
    send: async () => {
      sends += 1;
    },
    savePaid: async () => {
      throw new Error("should not save again");
    },
  });
  assert.equal(sends, 1);
  assert.equal(second.sent, false);
  assert.equal(second.booking.ticketSentAt, first.booking.ticketSentAt);
});

test("confirm with no email does not send or stamp", async () => {
  let sends = 0;
  const result = await runConfirm(booking({ email: "" }), {
    now: "2026-09-24T01:00:00.000Z",
    send: async () => {
      sends += 1;
    },
    savePaid: async () => {
      throw new Error("should not save");
    },
  });
  assert.equal(sends, 0);
  assert.equal(result.message, "No email on file — contact +6591234567");
  assert.equal(result.booking.status, "awaiting_payment");
});

test("cancelling a 3-seat paid booking releases those seats and exports the sheet", async () => {
  const paid = booking({ status: "paid", partySize: 3, tableNo: 8 });
  const copy = cancelCopy(paid);
  assert.equal(copy.refundNote, REFUND_NOTE);
  assert.match(copy.line, /GALA-0235 · Aryan Tan · 3 seats at Table 8/);

  const rows = [
    { tableNo: 8, partySize: 3, status: "paid" },
    { tableNo: 8, partySize: 2, status: "awaiting_payment" },
  ];
  assert.equal(seatsFilled(rows, 8), 5);

  let exported = 0;
  let stamped = "";
  const next = await runCancel(paid, {
    now: "2026-09-24T03:00:00.000Z",
    saveCancelled: async (at) => {
      stamped = at;
    },
    exportSheet: async () => {
      exported += 1;
    },
  });
  assert.equal(stamped, "2026-09-24T03:00:00.000Z");
  assert.equal(exported, 1);
  assert.equal(next.exportError, undefined);
  assert.equal(next.booking.status, "cancelled");
  const after = rows.map((row) =>
    row.partySize === 3 ? { ...row, status: "cancelled" } : row,
  );
  assert.equal(seatsFilled(after, 8), 2);
  assert.equal(seatsFilled(rows, 8) - seatsFilled(after, 8), 3);
});

test("a failed sheet export does not undo the cancel", async () => {
  const paid = booking({ status: "paid", partySize: 3, tableNo: 8 });
  let saved = false;
  const next = await runCancel(paid, {
    now: "2026-09-24T03:00:00.000Z",
    saveCancelled: async () => {
      saved = true;
    },
    exportSheet: async () => {
      throw new Error("Sheets unavailable");
    },
  });
  assert.equal(saved, true);
  assert.equal(next.booking.status, "cancelled");
  assert.equal(next.booking.cancelledAt, "2026-09-24T03:00:00.000Z");
  assert.equal(next.exportError, "Sheets unavailable");
});

test("buttons follow status and cancelled rows are dimmed", () => {
  assert.deepEqual(buttonState("awaiting_payment"), {
    confirm: true,
    resend: false,
    remind: true,
    cancel: true,
    dimmed: false,
  });
  assert.deepEqual(buttonState("claims_paid"), {
    confirm: true,
    resend: false,
    remind: true,
    cancel: true,
    dimmed: false,
  });
  assert.deepEqual(buttonState("paid", "2026-09-24T01:00:00.000Z"), {
    confirm: false,
    resend: true,
    remind: false,
    cancel: false,
    dimmed: false,
  });
  assert.deepEqual(buttonState("cancelled"), {
    confirm: false,
    resend: false,
    remind: false,
    cancel: false,
    dimmed: true,
  });
  assert.equal(cancelCopy(booking()).refundNote, null);
});

test("a paid complimentary booking can still send the ticket until it is stamped", async () => {
  assert.deepEqual(buttonState("paid", null), {
    confirm: true,
    resend: false,
    remind: false,
    cancel: false,
    dimmed: false,
  });
  const complimentary = booking({
    status: "paid",
    amount: 0,
    partySize: 2,
    ticketSentAt: null,
  });
  assert.equal(planConfirm(complimentary).type, "send");
  let sends = 0;
  const first = await runConfirm(complimentary, {
    now: "2026-09-24T01:00:00.000Z",
    send: async () => {
      sends += 1;
    },
    savePaid: async () => {},
  });
  assert.equal(sends, 1);
  assert.equal(first.sent, true);
  assert.equal(first.booking.ticketSentAt, "2026-09-24T01:00:00.000Z");
  assert.deepEqual(buttonState(first.booking.status, first.booking.ticketSentAt), {
    confirm: false,
    resend: true,
    remind: false,
    cancel: false,
    dimmed: false,
  });
});

test("resend is a no-op until the first ticket send, then sends again", async () => {
  const unpaid = booking();
  assert.equal(planResend(unpaid).type, "noop");
  const skipped = await runResend(unpaid, {
    now: "2026-09-24T02:00:00.000Z",
    send: async () => {
      throw new Error("should not send before the first ticket");
    },
    saveSent: async () => {
      throw new Error("should not save before the first ticket");
    },
  });
  assert.equal(skipped.sent, false);

  const stamped = booking({
    status: "paid",
    ticketSentAt: "2026-09-24T01:00:00.000Z",
  });
  assert.equal(planResend(stamped).type, "send");
  let sends = 0;
  let saved = "";
  const resent = await runResend(stamped, {
    now: "2026-09-24T03:00:00.000Z",
    send: async () => {
      sends += 1;
    },
    saveSent: async (at) => {
      saved = at;
    },
  });
  assert.equal(sends, 1);
  assert.equal(saved, "2026-09-24T03:00:00.000Z");
  assert.equal(resent.sent, true);
  assert.equal(resent.booking.ticketSentAt, "2026-09-24T03:00:00.000Z");
  assert.deepEqual(buttonState(resent.booking.status, resent.booking.ticketSentAt), {
    confirm: false,
    resend: true,
    remind: false,
    cancel: false,
    dimmed: false,
  });
});

test("resend with no email does not send", async () => {
  const result = await runResend(
    booking({
      status: "paid",
      ticketSentAt: "2026-09-24T01:00:00.000Z",
      email: "",
    }),
    {
      now: "2026-09-24T03:00:00.000Z",
      send: async () => {
        throw new Error("should not send");
      },
      saveSent: async () => {
        throw new Error("should not save");
      },
    },
  );
  assert.equal(result.sent, false);
  assert.equal(result.message, "No email on file — contact +6591234567");
});

test("ticket email is the UWCSEA table layout with the logo and no QR", () => {
  const row = booking();
  const html = ticketHtml(row);
  assert.equal(
    ticketSubject(row),
    "Your tickets — GALA-0235 · UWCSEA Dover Graduation Gala",
  );
  assert.equal(
    ticketSummaryLine(row),
    "GALA-0235 · Table 12 · 3 seats · Saturday, 22 May 2027 · Fairmont Ballroom, Raffles City",
  );
  assert.match(html, /<table/i);
  assert.match(html, /#101d33/);
  assert.match(html, /Dear Aryan Tan,/);
  assert.match(
    html,
    /Your booking is confirmed\. Your E-Tickets are attached to this email\./,
  );
  assert.match(
    html,
    /GALA-0235 · Table 12 · 3 seats · Saturday, 22 May 2027 · Fairmont Ballroom, Raffles City/,
  );
  assert.match(html, /src="cid:uwcsea-logo"/);
  assert.match(html, /alt="UWCSEA"/);
  const logo = readFileSync(path.join(process.cwd(), "public", "uwcsea-logo.png"));
  assert.equal(logo[1], 0x50);
  assert.equal(logo.subarray(1, 4).toString("ascii"), "PNG");
  assert.match(html, /isn't monitored/);
  assert.match(html, /mailto:Padovergraduation@gapps\.uwcsea\.edu\.sg/i);
  assert.doesNotMatch(html, /QR code/i);
  assert.doesNotMatch(html, /<button/i);
  assert.doesNotMatch(html, /supabase/i);
  assert.doesNotMatch(html, /href="https?:\/\//i);
});

test("reminder email uses the 12-hour outstanding-payment copy", () => {
  const text = reminderText();
  assert.match(text, /has NOT been confirmed yet/);
  assert.match(text, /next 12 hours/);
  assert.match(text, /\+6598193518/);
  assert.match(text, /padovergraduation@gapps\.uwcsea\.edu\.sg/i);
  assert.match(text, /Grade Reps/);
});

test("cancellation email says the seats are released", () => {
  const text = cancellationText();
  assert.equal(
    text,
    "Your booking has been cancelled and the seats have been released for booking again!",
  );
});
