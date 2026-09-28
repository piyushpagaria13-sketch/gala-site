import assert from "node:assert/strict";
import { test } from "node:test";
import { padTableGuests, startingGuestCards } from "../lib/guestRoster.ts";

test("a table booking is always 10 cards", () => {
  const empty = padTableGuests([], "Ada Tan");
  assert.equal(empty.length, 10);
  assert.equal(empty[0]?.kind, "student");
  assert.equal(empty[0]?.name, "Ada Tan");
  assert.ok(empty.slice(1).every((g) => g.kind === "guest" && g.name === ""));
});

test("table padding keeps filled names and never exceeds 10", () => {
  const padded = padTableGuests(
    [
      { name: "Ada Tan", kind: "student" },
      { name: "Pat Tan", kind: "guest" },
    ],
    "Ada Tan",
  );
  assert.equal(padded.length, 10);
  assert.equal(padded[1]?.name, "Pat Tan");
  assert.equal(
    padTableGuests(
      Array.from({ length: 12 }, (_, i) => ({
        name: `G${i}`,
        kind: i === 0 ? ("student" as const) : ("guest" as const),
      })),
      "Ada Tan",
    ).length,
    10,
  );
});

test("starting cards never go below 1 or above 10", () => {
  assert.equal(startingGuestCards("Ada", 2).length, 2);
  assert.equal(startingGuestCards("Ada", 1).length, 1);
  assert.equal(startingGuestCards("Ada", 99).length, 10);
});
