import assert from "node:assert/strict";
import { test } from "node:test";
import { NAME_ALREADY_BOOKED_MESSAGE } from "../lib/studentBooking.ts";

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
