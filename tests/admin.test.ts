import assert from "node:assert/strict";
import { test } from "node:test";
import { adminCookieMatches, adminGuard, passwordsMatch } from "../lib/adminAuth.ts";
import {
  REFUND_NOTE,
  buttonState,
  cancelCopy,
  planConfirm,
  reminderText,
  runCancel,
  runConfirm,
  seatsFilled,
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
  assert.equal(next.status, "cancelled");
  const after = rows.map((row) =>
    row.partySize === 3 ? { ...row, status: "cancelled" } : row,
  );
  assert.equal(seatsFilled(after, 8), 2);
  assert.equal(seatsFilled(rows, 8) - seatsFilled(after, 8), 3);
});

test("buttons follow status and cancelled rows are dimmed", () => {
  assert.deepEqual(buttonState("awaiting_payment"), {
    confirm: true,
    remind: true,
    cancel: true,
    dimmed: false,
  });
  assert.deepEqual(buttonState("claims_paid"), {
    confirm: true,
    remind: true,
    cancel: true,
    dimmed: false,
  });
  assert.deepEqual(buttonState("paid"), {
    confirm: false,
    remind: false,
    cancel: true,
    dimmed: false,
  });
  assert.deepEqual(buttonState("cancelled"), {
    confirm: false,
    remind: false,
    cancel: false,
    dimmed: true,
  });
  assert.equal(cancelCopy(booking()).refundNote, null);
});

test("reminder email names the deadline and the screenshot reply", () => {
  const text = reminderText(booking(), 48);
  assert.match(text, /GALA-0235/);
  assert.match(text, /Table 12/);
  assert.match(text, /within 48 hours/);
  assert.match(text, /Already paid\? Reply with a screenshot/);
});
