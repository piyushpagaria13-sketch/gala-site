import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingTotal, payableSeats, SEAT_PRICE } from "../lib/pricing.ts";

test("payableSeats(4, 2) = 2", () => {
  assert.equal(payableSeats(4, 2), 2);
});

test("payableSeats(2, 2) = 0", () => {
  assert.equal(payableSeats(2, 2), 0);
});

test("bookingTotal uses payable seats × SEAT_PRICE", () => {
  assert.equal(bookingTotal(4, 2), 2 * SEAT_PRICE);
  assert.equal(bookingTotal(2, 2), 0);
});
