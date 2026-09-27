import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookingReceivedSubject,
  bookingReceivedText,
} from "../lib/bookingReceived.ts";

test("a 3-seat booking at table 23 names the table, seats, and guests", () => {
  const text = bookingReceivedText({
    ref: "GALA-0231",
    tableNo: 23,
    partySize: 3,
    guests: ["Aryan Tan", "Priya Tan", "Rajesh Tan"],
  });

  assert.match(text, /Table 23/);
  assert.match(text, /3 seats/);
  assert.match(text, /Aryan Tan/);
  assert.match(text, /Priya Tan/);
  assert.match(text, /Rajesh Tan/);
  assert.equal(
    bookingReceivedSubject("GALA-0231"),
    "We've received your booking request — GALA-0231 (pending confirmation)",
  );
});
