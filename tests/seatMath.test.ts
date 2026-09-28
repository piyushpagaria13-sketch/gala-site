import assert from "node:assert/strict";
import { test } from "node:test";
import { canSelect, derive, dotRow, TABLE_FULL_MESSAGE } from "../lib/seatMath.ts";

test("derive: one 3-seat booking → 3 filled, 7 remaining", () => {
  assert.deepEqual(derive([3]), { filled: 3, remaining: 7 });
});

test("derive: bookings of 5 and 3 → 8 filled, 2 remaining", () => {
  assert.deepEqual(derive([5, 3]), { filled: 8, remaining: 2 });
});

test("derive: no bookings → 0 filled, 10 remaining", () => {
  assert.deepEqual(derive([]), { filled: 0, remaining: 10 });
});

test("canSelect: remaining 2, party 3 is full capacity", () => {
  const res = canSelect(2, 3);
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error, TABLE_FULL_MESSAGE);
  }
});

test("canSelect: remaining 0, party 1 is full capacity", () => {
  const res = canSelect(0, 1);
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error, TABLE_FULL_MESSAGE);
  }
});

test("canSelect: remaining 2 plus party 2 fills the table; 3 does not", () => {
  assert.deepEqual(canSelect(2, 2), { ok: true });
  const over = canSelect(2, 3);
  assert.equal(over.ok, false);
});

test("canSelect: remaining 5, party 3 → ok", () => {
  assert.deepEqual(canSelect(5, 3), { ok: true });
});

test("dotRow: 5 confirmed + party of 3 → 5 solid, 3 selected, 2 empty", () => {
  assert.deepEqual(dotRow(5, 3), [
    "solid",
    "solid",
    "solid",
    "solid",
    "solid",
    "selected",
    "selected",
    "selected",
    "empty",
    "empty",
  ]);
});

test("dotRow: no selection → confirmed solid, rest empty", () => {
  assert.deepEqual(dotRow(2, 0), [
    "solid",
    "solid",
    "empty",
    "empty",
    "empty",
    "empty",
    "empty",
    "empty",
    "empty",
    "empty",
  ]);
});
