import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookingReceivedHtml,
  bookingReceivedSubject,
  bookingReceivedText,
} from "../lib/bookingReceived.ts";

test("booking-received auto-reply uses the pending-confirmation copy", () => {
  const text = bookingReceivedText({
    ref: "GALA-0231",
    tableNo: 23,
    partySize: 3,
    guests: ["Aryan Tan", "Priya Tan", "Rajesh Tan"],
  });

  assert.equal(
    bookingReceivedSubject(),
    "We've received your booking request! (Pending Confirmation)",
  );
  assert.match(text, /Graduation Gala Dinner 2027/);
  assert.match(text, /22 May at 7:30/);
  assert.match(
    text,
    /Look out for another email with confirmation of your tickets/,
  );
  assert.match(text, /The graduation committee/);
  assert.match(text, /Scan the PayNow QR in this email/);
  const html = bookingReceivedHtml({
    ref: "GALA-0231",
    tableNo: 23,
    partySize: 3,
    guests: ["Aryan Tan", "Priya Tan", "Rajesh Tan"],
  });
  assert.match(html, /src="cid:paynow-qr"/);
  assert.match(html, /alt="PayNow QR code"/);
  assert.doesNotMatch(
    bookingReceivedHtml(
      {
        ref: "GALA-0231",
        tableNo: 23,
        partySize: 3,
        guests: ["Aryan Tan"],
      },
      { includeQr: false },
    ),
    /cid:paynow-qr/,
  );
});
