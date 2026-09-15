import assert from "node:assert/strict";
import { test } from "node:test";
import { canSelect, derive, dotRow } from "../lib/seatMath.ts";

test("derive: one 3-seat booking → 3 filled, 7 remaining", () => {
  assert.deepEqual(derive([3]), { filled: 3, remaining: 7 });
});

test("derive: bookings of 5 and 3 → 8 filled, 2 remaining", () => {
  assert.deepEqual(derive([5, 3]), { filled: 8, remaining: 2 });
});

test("derive: no bookings → 0 filled, 10 remaining", () => {
  assert.deepEqual(derive([]), { filled: 0, remaining: 10 });
});

test("canSelect: remaining 2, party 3 → rejected, error mentions 2", () => {
  const res = canSelect(2, 3);
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.match(res.error, /only 2 seats left/);
  }
});

test("canSelect: remaining 1 uses singular 'seat'", () => {
  const res = canSelect(1, 3);
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.match(res.error, /only 1 seat left/);
  }
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
