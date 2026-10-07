import assert from "node:assert/strict";
import { test } from "node:test";
import {
  liveBookingLimitReached,
  MAX_LIVE_BOOKINGS_PER_STUDENT,
  MAX_LIVE_BOOKINGS_RESERVED,
  NAME_ALREADY_BOOKED_MESSAGE,
} from "../lib/studentBooking.ts";

test("already-booked copy names the PA mailbox", () => {
  assert.match(
    NAME_ALREADY_BOOKED_MESSAGE,
    /You have already used this name to book tickets/,
  );
  assert.match(
    NAME_ALREADY_BOOKED_MESSAGE,
    /Padovergraduation@gapps\.uwcsea\.edu\.sg/,
  );
});

test("a graduate may book twice; the third attempt is blocked", () => {
  assert.equal(MAX_LIVE_BOOKINGS_PER_STUDENT, 2);
  assert.equal(liveBookingLimitReached(0), false);
  assert.equal(liveBookingLimitReached(1), false);
  assert.equal(liveBookingLimitReached(2), true);
  assert.equal(liveBookingLimitReached(3), true);
});

test("a reserved complimentary recipient is blocked on the second booking", () => {
  assert.equal(MAX_LIVE_BOOKINGS_RESERVED, 1);
  assert.equal(liveBookingLimitReached(0, true), false);
  assert.equal(liveBookingLimitReached(1, true), true);
  assert.equal(liveBookingLimitReached(2, true), true);
});
