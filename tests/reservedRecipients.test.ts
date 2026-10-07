import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isReservedRecipient,
  RESERVED_RECIPIENTS,
} from "../lib/reservedRecipients.ts";

test("the reserved list is the 25 names from the Class of 2027 sheet", () => {
  assert.equal(RESERVED_RECIPIENTS.length, 25);
  assert.equal(
    isReservedRecipient({
      preferredName: "Asep",
      officialName: "Asep",
      familyName: "PUTRA",
    }),
    true,
  );
  assert.equal(
    isReservedRecipient({ name: "Millie AM" }),
    true,
  );
  assert.equal(
    isReservedRecipient({
      preferredName: "Melo",
      officialName: "Simelokuhle",
      familyName: "NKAMBULE",
    }),
    true,
  );
  assert.equal(
    isReservedRecipient({ name: "Aryan Tan", compSeats: 0 }),
    false,
  );
});
