import assert from "node:assert/strict";
import { test } from "node:test";
import { studentMatchesExact } from "../lib/studentMatch.ts";

const nayelhi = {
  name: "Nayelhi GOMEZ GARCIA",
  preferredName: "Nayelhi",
  officialName: "Sara",
  familyName: "GOMEZ GARCIA",
};

test("official plus preferred name identifies the reserved student", () => {
  assert.equal(studentMatchesExact(nayelhi, "Sara nayelhi"), true);
  assert.equal(studentMatchesExact(nayelhi, "sara Nayelhi"), true);
  assert.equal(studentMatchesExact(nayelhi, "Nayelhi Sara"), true);
  assert.equal(studentMatchesExact(nayelhi, "Sara"), true);
  assert.equal(studentMatchesExact(nayelhi, "Nayelhi"), true);
  assert.equal(studentMatchesExact(nayelhi, "Nayelhi GOMEZ GARCIA"), true);
  assert.equal(studentMatchesExact(nayelhi, "Sara GOMEZ GARCIA"), true);
});

test("family name alone does not identify a student", () => {
  assert.equal(studentMatchesExact(nayelhi, "GOMEZ GARCIA"), false);
  assert.equal(studentMatchesExact(nayelhi, "Minato ABE"), false);
});
