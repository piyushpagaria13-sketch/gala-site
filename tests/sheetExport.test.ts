import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingTotal } from "../lib/pricing.ts";
import {
  exportSnapshot as exportAll,
  sheetFormatRequests,
  TABLE_COUNT,
  type MirrorBooking,
  type SheetSnapshot,
  type SheetTab,
} from "../lib/sheetRows.ts";

/**
 * Aryan Tan has 2 complimentary seats. Party 4 pays for 2 × S$218.
 * The Bookings tab is one row per guest, so 4 guests produce 4 rows.
 * The table count uses party_size, so the section still shows 4/10.
 */

const AMOUNT = bookingTotal(4, 2);

function tables() {
  return Array.from({ length: TABLE_COUNT }, (_, index) => ({
    tableNo: index + 1,
    blocked: [6, 15, 88].includes(index + 1),
  }));
}

function aryanBooking(status = "awaiting_payment"): MirrorBooking {
  return {
    ref: "GALA-0007",
    student: "Aryan Tan",
    tableNo: 40,
    partySize: 4,
    cars: 1,
    busSeats: 2,
    contact: "+65 8111 0000",
    status,
    amount: AMOUNT,
    guests: [
      {
        name: "Guest One",
        age: "18",
        dietary: "Chicken",
        allergyNote: "",
        sortOrder: 0,
      },
      {
        name: "Guest Two",
        age: "47",
        dietary: "Vegetarian",
        allergyNote: "Peanuts",
        sortOrder: 1,
      },
      {
        name: "Guest Three",
        age: "16",
        dietary: "Fish",
        allergyNote: "",
        sortOrder: 2,
      },
      {
        name: "Guest Four",
        age: "18",
        dietary: "Chicken",
        allergyNote: "Shellfish",
        sortOrder: 3,
      },
    ],
  };
}

function snapshot(booking: MirrorBooking): SheetSnapshot {
  return { tables: tables(), bookings: [booking] };
}

async function run(booking: MirrorBooking): Promise<SheetTab[]> {
  return exportAll({
    load: async () => snapshot(booking),
    write: async () => {},
  });
}

test("comp booking rewrites Bookings rows and a 4/10 table section", async () => {
  const written: SheetTab[] = [];
  const tabs = await exportAll({
    load: async () => snapshot(aryanBooking()),
    write: async (next) => {
      written.push(...next);
    },
  });

  assert.deepEqual(
    written.map((tab) => tab.title),
    ["Bookings", "Tables & Seats"],
  );

  const bookings = tabs[0].rows;
  assert.deepEqual(bookings[0], [
    "Ref",
    "Student",
    "Table",
    "Guest name",
    "Age",
    "Dietary",
    "Allergy note",
    "Cars",
    "Bus seats",
    "Contact",
    "Status",
    "Amount",
  ]);
  assert.equal(bookings.length, 5);
  for (const row of bookings.slice(1)) {
    assert.equal(row[0], "GALA-0007");
    assert.equal(row[1], "Aryan Tan");
    assert.equal(row[2], "40");
    assert.equal(row[7], "1");
    assert.equal(row[8], "2");
    assert.equal(row[9], "+65 8111 0000");
    assert.equal(row[10], "awaiting_payment");
    assert.equal(row[11], String(AMOUNT));
  }
  assert.equal(bookings[1][3], "Guest One");
  assert.equal(bookings[1][5], "Chicken");
  assert.equal(bookings[2][3], "Guest Two");
  assert.equal(bookings[2][5], "Vegetarian");
  assert.equal(bookings[2][6], "Peanuts");
  assert.equal(bookings[3][3], "Guest Three");
  assert.equal(bookings[3][5], "Fish");
  assert.equal(bookings[4][3], "Guest Four");
  assert.equal(bookings[4][6], "Shellfish");

  const tablesTab = tabs[1].rows;
  const summaryAt = tablesTab.findIndex((row) =>
    row[0].startsWith("Table 40 ·"),
  );
  assert.equal(tablesTab[summaryAt][0], "Table 40 · 4/10 · 6 left");
  assert.deepEqual(tablesTab[summaryAt + 1], [
    "Guest One",
    "18",
    "Chicken",
    "",
    "Aryan Tan",
    "GALA-0007",
    "awaiting_payment",
  ]);
  assert.equal(tablesTab[summaryAt + 2][0], "Guest Two");
  assert.equal(tablesTab[summaryAt + 3][0], "Guest Three");
  assert.equal(tablesTab[summaryAt + 4][0], "Guest Four");
  assert.equal(tabs[1].boldRows.includes(summaryAt), true);
});

test("a cancelled booking leaves both tabs and the table count drops", async () => {
  const before = await run(aryanBooking("awaiting_payment"));
  const after = await run(aryanBooking("cancelled"));

  assert.equal(before[0].rows.length, 5);
  assert.equal(after[0].rows.length, 1);

  const beforeSummary = before[1].rows.find((row) =>
    row[0].startsWith("Table 40 ·"),
  );
  const afterSummary = after[1].rows.find((row) =>
    row[0].startsWith("Table 40 ·"),
  );
  assert.equal(beforeSummary?.[0], "Table 40 · 4/10 · 6 left");
  assert.equal(afterSummary?.[0], "Table 40 · — empty —");
  assert.equal(
    after[1].rows.some((row) => row.includes("GALA-0007")),
    false,
  );
});

test("empty and blocked tables render summary rows, header stays frozen and bold", async () => {
  const tabs = await run(aryanBooking());
  const rows = tabs[1].rows;
  const summaries = rows.filter((row) => row[0].startsWith("Table "));
  assert.equal(summaries.length, 100);
  assert.equal(
    rows.find((row) => row[0].startsWith("Table 1 ·"))?.[0],
    "Table 1 · — empty —",
  );
  assert.equal(
    rows.find((row) => row[0].startsWith("Table 6 ·"))?.[0],
    "Table 6 · BLOCKED",
  );
  assert.equal(
    rows.find((row) => row[0].startsWith("Table 15 ·"))?.[0],
    "Table 15 · BLOCKED",
  );
  assert.equal(
    rows.find((row) => row[0].startsWith("Table 88 ·"))?.[0],
    "Table 88 · BLOCKED",
  );

  const requests = sheetFormatRequests(7, [1]) as {
    updateSheetProperties?: {
      properties: { gridProperties: { frozenRowCount: number } };
    };
    repeatCell?: {
      range: { startRowIndex: number; endRowIndex: number };
      cell: { userEnteredFormat: { textFormat: { bold: boolean } } };
    };
  }[];
  const frozen = requests.find((request) => request.updateSheetProperties);
  assert.equal(
    frozen?.updateSheetProperties?.properties.gridProperties.frozenRowCount,
    1,
  );
  const headerBold = requests.find(
    (request) =>
      request.repeatCell?.range.startRowIndex === 0 &&
      request.repeatCell.range.endRowIndex === 1 &&
      request.repeatCell.cell.userEnteredFormat.textFormat.bold,
  );
  assert.ok(headerBold);
});
