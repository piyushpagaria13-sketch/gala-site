import assert from "node:assert/strict";
import { test } from "node:test";
import { emailLooksInvalid, isValidEmail } from "../lib/email.ts";

test("a real-looking address is valid", () => {
  assert.equal(isValidEmail("guest@example.com"), true);
  assert.equal(isValidEmail("  Guest@UWCSEA.edu.sg  "), true);
  assert.equal(emailLooksInvalid("guest@example.com"), false);
});

test("empty or malformed addresses are not valid", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("guest"), false);
  assert.equal(isValidEmail("guest@"), false);
  assert.equal(emailLooksInvalid("guest"), true);
  assert.equal(emailLooksInvalid(""), false);
});
