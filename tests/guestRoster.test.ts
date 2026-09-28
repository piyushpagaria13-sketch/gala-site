import assert from "node:assert/strict";
import { test } from "node:test";
import { padTableGuests, padSeatGuests, startingGuestCards, isGuestRosterComplete, duplicateStudentIndexes, trimTrailingBlankGuests, canAddGuestCard, appendGuestCard } from "../lib/guestRoster.ts";

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

test("a table roster is not complete until all 10 cards are filled", () => {
  const four = padTableGuests(
    [
      { name: "Ada Tan", kind: "student", dietary: "Chicken" },
      {
        name: "Pat Tan",
        kind: "guest",
        graduatingStudent: "Ada Tan",
        title: "Mother/Father",
        dietary: "Fish",
      },
      {
        name: "Jo Tan",
        kind: "student",
        dietary: "Vegetarian",
      },
      {
        name: "Sam Tan",
        kind: "guest",
        graduatingStudent: "Jo Tan",
        title: "Siblings @UWCSEA",
        dietary: "Chicken",
      },
    ],
    "Ada Tan",
  );
  assert.equal(four.length, 10);
  assert.equal(isGuestRosterComplete("table", four), false);
  assert.equal(
    isGuestRosterComplete(
      "table",
      four.slice(0, 4),
    ),
    false,
  );
});

test("a table roster is complete only with 10 finished cards", () => {
  const guests = Array.from({ length: 10 }, (_, i) =>
    i === 0
      ? { name: "Ada Tan", kind: "student" as const, dietary: "Chicken" }
      : {
          name: `Guest ${i}`,
          kind: "guest" as const,
          graduatingStudent: "Ada Tan",
          title: "Others",
          dietary: "Fish",
        },
  );
  assert.equal(isGuestRosterComplete("table", guests), true);
  assert.equal(isGuestRosterComplete("seats", guests.slice(0, 4)), true);
});

test("starting cards never go below 1 or above 10", () => {
  assert.equal(startingGuestCards("Ada", 2).length, 2);
  assert.equal(startingGuestCards("Ada", 1).length, 1);
  assert.equal(startingGuestCards("Ada", 99).length, 10);
});

test("a seats booking keeps the chosen card count, not two", () => {
  const three = padSeatGuests([], "Ada Tan", 3);
  assert.equal(three.length, 3);
  assert.equal(three[0]?.kind, "student");
  assert.equal(canAddGuestCard(three), true);
  assert.equal(appendGuestCard(three, "guest").length, 4);
  assert.equal(appendGuestCard(three, "guest")[3]?.kind, "guest");
  const four = padSeatGuests(three, "Ada Tan", 4);
  assert.equal(four.length, 4);
  assert.equal(
    isGuestRosterComplete(
      "seats",
      [
        { name: "Ada Tan", kind: "student", dietary: "Chicken" },
        {
          name: "Pat Tan",
          kind: "guest",
          graduatingStudent: "Ada Tan",
          title: "Others",
          dietary: "Fish",
        },
      ],
      3,
    ),
    false,
  );
});

test("a seats booking can add guests up to 10", () => {
  const nine = padSeatGuests([], "Ada Tan", 9);
  assert.equal(canAddGuestCard(nine), true);
  assert.equal(appendGuestCard(nine, "guest").length, 10);
  const ten = padSeatGuests([], "Ada Tan", 10);
  assert.equal(canAddGuestCard(ten), false);
  assert.equal(appendGuestCard(ten, "guest").length, 10);
});

test("add stays disabled at 10 cards and enables after a deletion", () => {
  const ten = padTableGuests([], "Ada Tan");
  assert.equal(ten.length, 10);
  assert.equal(canAddGuestCard(ten), false);
  assert.equal(canAddGuestCard(ten.slice(0, 9)), true);
  assert.equal(appendGuestCard(ten.slice(0, 9), "student").length, 10);
});

test("trailing blank cards are trimmed so add stays available", () => {
  const trimmed = trimTrailingBlankGuests(
    [
      { name: "Ada Tan", kind: "student", dietary: "Chicken" },
      { name: "Pat Tan", kind: "guest", graduatingStudent: "Ada Tan", title: "Others", dietary: "Fish" },
      { name: "", kind: "guest" },
      { name: "", kind: "guest" },
    ],
    2,
  );
  assert.equal(trimmed.length, 2);
  assert.equal(canAddGuestCard(trimmed), true);
  assert.equal(appendGuestCard(trimmed, "student").length, 3);
  assert.equal(appendGuestCard(trimmed, "student")[2]?.kind, "student");
  const ten = Array.from({ length: 10 }, (_, i) => ({
    name: `G${i}`,
    kind: i === 0 ? ("student" as const) : ("guest" as const),
  }));
  assert.equal(canAddGuestCard(ten), false);
  assert.equal(appendGuestCard(ten, "guest").length, 10);
});

test("the same student cannot occupy two cards", () => {
  const dupes = [
    { name: "Minato ABE", kind: "student" as const, dietary: "Chicken" },
    { name: "minato abe", kind: "student" as const, dietary: "Fish" },
  ];
  assert.deepEqual(duplicateStudentIndexes(dupes), [0, 1]);
  assert.equal(isGuestRosterComplete("seats", dupes), false);
});

test("a guest cannot reuse a student already on a student card", () => {
  const mixed = [
    { name: "Minato ABE", kind: "student" as const, dietary: "Chicken" },
    {
      name: "Minato ABE",
      kind: "guest" as const,
      graduatingStudent: "Minato ABE",
      title: "Others",
      dietary: "Fish",
    },
  ];
  assert.deepEqual(duplicateStudentIndexes(mixed), [1]);
  assert.equal(isGuestRosterComplete("seats", mixed), false);
});

test("two different students on two cards is allowed", () => {
  const two = [
    { name: "Minato ABE", kind: "student" as const, dietary: "Chicken" },
    { name: "Ashita AGARWAL", kind: "student" as const, dietary: "Fish" },
  ];
  assert.deepEqual(duplicateStudentIndexes(two), []);
  assert.equal(isGuestRosterComplete("seats", two), true);
});

test("a two-seat booking is complete with two filled cards", () => {
  const pair = [
    { name: "Chanhong YAIM", kind: "student" as const, dietary: "Chicken" },
    {
      name: "Pat Tan",
      kind: "guest" as const,
      graduatingStudent: "Chanhong YAIM",
      title: "Others",
      dietary: "Fish",
    },
  ];
  assert.equal(isGuestRosterComplete("seats", pair, 2), true);
  assert.equal(isGuestRosterComplete("seats", pair.slice(0, 1), 2), false);
  assert.equal(padSeatGuests([], "Chanhong YAIM", 2).length, 2);
});
