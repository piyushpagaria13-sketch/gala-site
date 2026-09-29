import assert from "node:assert/strict";
import { test } from "node:test";
import { derive, dotRow } from "../lib/seatMath.ts";
import {
  mapSeatedFamilies,
  moreFamiliesLine,
  seatedFamilyLabel,
  seatedHereView,
} from "../lib/seatedFamilies.ts";

test("preferred name plus family initial", () => {
  assert.equal(
    seatedFamilyLabel({
      name: "Ruhani SURANA",
      preferred_name: "Ruhani",
      family_name: "SURANA",
    }),
    "Ruhani S.",
  );
  assert.equal(
    seatedFamilyLabel({
      name: "Asep PUTRA",
      preferred_name: "Asep",
      family_name: "PUTRA",
    }),
    "Asep P.",
  );
});

test("a single-word name with no family is shown as-is", () => {
  assert.equal(
    seatedFamilyLabel({ name: "Melo", preferred_name: "Melo", family_name: "" }),
    "Melo",
  );
  assert.equal(seatedFamilyLabel({ name: "Melo" }), "Melo");
});

test("falls back to the name column when preferred/family are missing", () => {
  assert.equal(
    seatedFamilyLabel({ name: "Kingyel Wangchuk DORJI" }),
    "Kingyel D.",
  );
});

test("table with bookings of 3 and 5 seats lists two cards and 8 filled dots", () => {
  const cards = mapSeatedFamilies([
    {
      party_size: 3,
      students: {
        name: "Ruhani SURANA",
        preferred_name: "Ruhani",
        family_name: "SURANA",
      },
    },
    {
      party_size: 5,
      students: {
        name: "Asep PUTRA",
        preferred_name: "Asep",
        family_name: "PUTRA",
      },
    },
  ]);
  assert.equal(cards.length, 2);
  assert.equal(cards[0]?.label, "Ruhani S.");
  assert.equal(cards[0]?.seatsLabel, "3 seats");
  assert.equal(cards[1]?.label, "Asep P.");
  assert.equal(cards[1]?.seatsLabel, "5 seats");

  const { filled, remaining } = derive(cards.map((card) => card.partySize));
  assert.equal(filled, 8);
  assert.equal(remaining, 2);
  const dots = dotRow(filled, 0);
  assert.equal(dots.filter((dot) => dot === "solid").length, 8);
  assert.equal(dots.filter((dot) => dot === "empty").length, 2);

  const view = seatedHereView(cards, true);
  assert.equal(view.kind, "list");
  if (view.kind === "list") {
    assert.equal(view.cards.length, 2);
    assert.equal(view.more, 0);
  }
});

test("empty table is the all-yours line", () => {
  assert.deepEqual(seatedHereView([], true), { kind: "empty" });
});

test("SHOW_SEATED_FAMILIES=false hides the section entirely", () => {
  const cards = mapSeatedFamilies([{ party_size: 3, students: { name: "Asep PUTRA" } }]);
  assert.deepEqual(seatedHereView(cards, false), { kind: "hidden" });
  assert.deepEqual(seatedHereView([], false), { kind: "hidden" });
});

test("more than four families caps the list", () => {
  const cards = mapSeatedFamilies(
    Array.from({ length: 6 }, (_, i) => ({
      party_size: 1,
      students: { preferred_name: `Guest${i}`, family_name: "Tan" },
    })),
  );
  const view = seatedHereView(cards, true);
  assert.equal(view.kind, "list");
  if (view.kind === "list") {
    assert.equal(view.cards.length, 4);
    assert.equal(view.more, 2);
    assert.equal(moreFamiliesLine(view.more), "+2 more families");
  }
});
