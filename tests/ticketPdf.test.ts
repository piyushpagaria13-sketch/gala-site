import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import {
  buildTicketPdf,
  countPixelsChangedOutsidePlaque,
  pageImageCount,
  paintPlaque,
  plaqueText,
  ticketByline,
  ticketPdfFilename,
  ticketSeats,
} from "../lib/ticketPdf.ts";

const guests = [
  { name: "Ruhani Surana", sortOrder: 0 },
  { name: "Piyush Tan", sortOrder: 1 },
];

test("plaque copy is table-only unless seat numbers are on", () => {
  assert.equal(plaqueText(6, 2, false), "TABLE 6");
  assert.equal(plaqueText(6, 2, true), "TABLE 6 · SEAT 2");
  assert.equal(
    ticketByline("Ruhani Surana", "GALA-0031"),
    "RUHANI SURANA · GALA-0031",
  );
  assert.equal(ticketPdfFilename("GALA-0031"), "GALA-0031-tickets.pdf");
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

test("plaque paint leaves every pixel outside the inner cream unchanged", () => {
  const original = readFileSync(
    path.join(process.cwd(), "public", "ticket-base.png"),
  );
  const painted = paintPlaque(original);
  assert.equal(countPixelsChangedOutsidePlaque(original, painted), 0);
});

test("2-guest table 6 booking renders one page per full guest name", async () => {
  const bytes = await buildTicketPdf({
    ref: "GALA-0031",
    tableNo: 6,
    partySize: 2,
    guests,
    seatNumbers: false,
  });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2);

  for (const page of pdf.getPages()) {
    assert.equal(pageImageCount(page), 2);
    const { width, height } = page.getSize();
    assert.ok(height > 682);
    assert.ok(width === 1024);
  }

  const labels = ticketSeats({ guests, partySize: 2 }).map((seat) => ({
    plaque: plaqueText(6, seat.seat, false),
    byline: ticketByline(seat.name, "GALA-0031"),
    name: seat.name,
  }));
  assert.deepEqual(
    labels.map((row) => row.plaque),
    ["TABLE 6", "TABLE 6"],
  );
  assert.deepEqual(
    labels.map((row) => row.byline),
    ["RUHANI SURANA · GALA-0031", "PIYUSH TAN · GALA-0031"],
  );
  assert.equal(labels[1]?.name, "Piyush Tan");
});
