import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import {
  buildTicketPdf,
  pageImageCount,
  plaqueText,
  ticketByline,
  ticketPdfFilename,
  ticketSeats,
} from "../lib/ticketPdf.ts";

const guests = [
  { name: "Piyush Tan", sortOrder: 0 },
  { name: "Ruhani Surana", sortOrder: 1 },
  { name: "Aryan Tan", sortOrder: 2 },
  { name: "Priya Tan", sortOrder: 3 },
];

test("plaque copy is table-only unless seat numbers are on", () => {
  assert.equal(plaqueText(15, 2, false), "TABLE 15");
  assert.equal(plaqueText(15, 2, true), "TABLE 15 · SEAT 2");
  assert.equal(ticketByline("Piyush Tan", "GALA-0231"), "PIYUSH TAN · GALA-0231");
  assert.equal(ticketPdfFilename("GALA-0231"), "GALA-0231-tickets.pdf");
});

test("one seat per party member, filling unnamed seats", () => {
  const seats = ticketSeats({
    guests: [{ name: "Piyush Tan", sortOrder: 0 }],
    partySize: 3,
  });
  assert.deepEqual(
    seats.map((seat) => seat.name),
    ["Piyush Tan", "Guest 2", "Guest 3"],
  );
});

test("4-seat table 15 booking renders one page per guest with QR", async () => {
  const bytes = await buildTicketPdf({
    ref: "GALA-0231",
    tableNo: 15,
    partySize: 4,
    guests,
    seatNumbers: false,
  });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 4);

  for (const page of pdf.getPages()) {
    assert.equal(pageImageCount(page), 2);
    const { width, height } = page.getSize();
    assert.ok(width > height);
  }

  const labels = ticketSeats({ guests, partySize: 4 }).map((seat) => ({
    plaque: plaqueText(15, seat.seat, false),
    byline: ticketByline(seat.name, "GALA-0231"),
  }));
  assert.deepEqual(
    labels.map((row) => row.plaque),
    ["TABLE 15", "TABLE 15", "TABLE 15", "TABLE 15"],
  );
  assert.deepEqual(
    labels.map((row) => row.byline),
    [
      "PIYUSH TAN · GALA-0231",
      "RUHANI SURANA · GALA-0231",
      "ARYAN TAN · GALA-0231",
      "PRIYA TAN · GALA-0231",
    ],
  );
  assert.ok(bytes.byteLength < 900_000, `PDF too large: ${bytes.byteLength}`);
});
