import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appliedCompSeats,
  bookingTotal,
  payableSeats,
  SEAT_PRICE,
} from "../lib/pricing.ts";

test("only one complimentary seat is applied", () => {
  assert.equal(appliedCompSeats(2), 1);
  assert.equal(appliedCompSeats(1), 1);
  assert.equal(appliedCompSeats(0), 0);
  assert.equal(payableSeats(4, 2), 3);
  assert.equal(payableSeats(2, 2), 1);
  assert.equal(payableSeats(1, 2), 0);
});

test("bookingTotal uses payable seats × SEAT_PRICE", () => {
  assert.equal(bookingTotal(4, 2), 3 * SEAT_PRICE);
  assert.equal(bookingTotal(2, 2), SEAT_PRICE);
  assert.equal(bookingTotal(1, 2), 0);
});

test("a table of 10 with reserved complimentary seats pays for 9", () => {
  assert.equal(payableSeats(10, 2), 9);
  assert.equal(bookingTotal(10, 2), 9 * SEAT_PRICE);
});
