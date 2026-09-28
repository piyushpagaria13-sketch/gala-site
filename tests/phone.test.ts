import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isValidSingaporePhone,
  singaporeLocalDigits,
  singaporePhoneTooLong,
} from "../lib/phone.ts";

test("eight local digits are valid, with or without +65", () => {
  assert.equal(singaporeLocalDigits("81234567"), "81234567");
  assert.equal(isValidSingaporePhone("81234567"), true);
  assert.equal(singaporePhoneTooLong("81234567"), false);

  assert.equal(singaporeLocalDigits("+6581234567"), "81234567");
  assert.equal(isValidSingaporePhone("+65 8123 4567"), true);
  assert.equal(singaporePhoneTooLong("+65 8123 4567"), false);
});

test("a ninth digit keeps the too-long error, including after 65", () => {
  assert.equal(singaporePhoneTooLong("812345678"), true);
  assert.equal(isValidSingaporePhone("812345678"), false);

  assert.equal(singaporePhoneTooLong("651234567"), true);
  assert.equal(singaporeLocalDigits("651234567"), "651234567");
  assert.equal(isValidSingaporePhone("651234567"), false);

  assert.equal(singaporePhoneTooLong("+65812345678"), true);
  assert.equal(singaporeLocalDigits("+65812345678"), "812345678");
});

test("an 8-digit number that starts with 65 is still a local number", () => {
  assert.equal(singaporeLocalDigits("65123456"), "65123456");
  assert.equal(isValidSingaporePhone("65123456"), true);
  assert.equal(singaporePhoneTooLong("65123456"), false);
});
