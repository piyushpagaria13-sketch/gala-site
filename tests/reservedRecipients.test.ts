import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isReservedRecipient,
  RESERVED_RECIPIENTS,
} from "../lib/reservedRecipients.ts";

test("the reserved list is the remaining names yet to book", () => {
  assert.equal(RESERVED_RECIPIENTS.length, 9);
  assert.equal(isReservedRecipient({ name: "Nayelhi Gomez Garcia" }), true);
  assert.equal(isReservedRecipient({ name: "Gabriel Hernandez Solis" }), true);
  assert.equal(isReservedRecipient({ name: "Luka Pecanac" }), true);
  assert.equal(isReservedRecipient({ name: "Butter Trieu" }), true);
  assert.equal(isReservedRecipient({ name: "Alexander Li" }), true);
  assert.equal(isReservedRecipient({ name: "Mareb Ochieng" }), true);
  assert.equal(
    isReservedRecipient({
      preferredName: "Melo",
      officialName: "Simelokuhle",
      familyName: "NKAMBULE",
    }),
    true,
  );
  assert.equal(isReservedRecipient({ name: "Phetegue Abdoul Malick" }), true);
  assert.equal(isReservedRecipient({ name: "Kudzaishe Sewereni Nkhata" }), true);
  assert.equal(isReservedRecipient({ name: "Asep PUTRA" }), false);
  assert.equal(isReservedRecipient({ name: "Millie AM" }), false);
  assert.equal(isReservedRecipient({ name: "Aryan Tan" }), false);
});
