import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDict, PDFDocument, PDFFont, PDFName, PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

/** Ticket stamp copy. Kept here so node:test can load one file. */

export type TicketSeat = {
  name: string;
  seat: number;
};

export type TicketPdfInput = {
  ref: string;
  tableNo: number;
  partySize: number;
  guests: { name: string; sortOrder?: number }[];
  seatNumbers?: boolean;
};

const PLAQUE_GOLD = rgb(0.42, 0.32, 0.08);
const BYLINE_GOLD = rgb(0.83, 0.686, 0.216);
const CREAM = rgb(241 / 255, 226 / 255, 197 / 255);
const QR_BACK = rgb(0.97, 0.93, 0.84);

type EmbeddedFont = PDFFont;

export function plaqueText(
  tableNo: number,
  seat: number,
  seatNumbers: boolean,
): string {
  if (seatNumbers) return `TABLE ${tableNo} · SEAT ${seat}`;
  return `TABLE ${tableNo}`;
}

export function ticketByline(guestName: string, ref: string): string {
  const name = guestName.trim().toUpperCase() || "GUEST";
  return `${name} · ${ref.trim().toUpperCase()}`;
}

export function ticketSeats(input: {
  guests: { name: string; sortOrder?: number }[];
  partySize: number;
}): TicketSeat[] {
  const named = [...input.guests]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((guest) => guest.name.trim())
    .filter(Boolean);
  const count = Math.max(input.partySize, named.length, 1);
  return Array.from({ length: count }, (_, index) => ({
    name: named[index] || `Guest ${index + 1}`,
    seat: index + 1,
  }));
}

function publicPath(...parts: string[]): string {
  return path.join(process.cwd(), "public", ...parts);
}

async function readPublic(rel: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(publicPath(rel)));
}

async function loadBaseImage(pdf: PDFDocument) {
  try {
    const jpeg = await readPublic("ticket-base.jpg");
    return pdf.embedJpg(jpeg);
  } catch {
    const png = await readPublic("ticket-base.png");
    return pdf.embedPng(png);
  }
}

async function loadSerif(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  for (const file of [
    "fonts/PlayfairDisplay-SemiBold.ttf",
    "fonts/PlayfairDisplay.ttf",
  ]) {
    try {
      return await pdf.embedFont(await readPublic(file), { subset: true });
    } catch {
      /* try the next cut */
    }
  }
  return pdf.embedFont(StandardFonts.TimesRoman);
}

function wordGap(size: number): number {
  return size * 0.45;
}

function lineWidth(text: string, font: EmbeddedFont, size: number): number {
  const words = text.split(" ").filter(Boolean);
  if (!words.length) return 0;
  const wordsWidth = words.reduce((sum, word) => sum + font.widthOfTextAtSize(word, size), 0);
  return wordsWidth + wordGap(size) * (words.length - 1);
}

function fittedSize(
  text: string,
  font: EmbeddedFont,
  maxWidth: number,
  preferred: number,
): number {
  let size = preferred;
  while (size > 8 && lineWidth(text, font, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: EmbeddedFont,
  opts: { cx: number; y: number; size: number; color: ReturnType<typeof rgb> },
) {
  const { cx, y, size, color } = opts;
  const words = text.split(" ").filter(Boolean);
  let x = cx - lineWidth(text, font, size) / 2;
  const gap = wordGap(size);
  for (const word of words) {
    page.drawText(word, { x, y, size, font, color });
    x += font.widthOfTextAtSize(word, size) + gap;
  }
}

export function pageImageCount(page: {
  node: { Resources: () => PDFDict | undefined };
}): number {
  const resources = page.node.Resources();
  if (!resources) return 0;
  const xobject = resources.lookup(PDFName.of("XObject"));
  if (!(xobject instanceof PDFDict)) return 0;
  return xobject.keys().length;
}

export async function buildTicketPdf(input: TicketPdfInput): Promise<Uint8Array> {
  const seats = ticketSeats(input);
  const seatNumbers = Boolean(input.seatNumbers);
  const pdf = await PDFDocument.create();
  const [base, font, qrPng] = await Promise.all([
    loadBaseImage(pdf),
    loadSerif(pdf),
    QRCode.toBuffer(input.ref, {
      type: "png",
      margin: 1,
      width: 160,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1408", light: "#f7edd4" },
    }),
  ]);
  const qr = await pdf.embedPng(qrPng);
  const width = base.width;
  const height = base.height;

  const plaque = {
    x: width * 0.108,
    y: height * 0.184,
    w: width * 0.668,
    h: height * 0.068,
  };

  for (const seat of seats) {
    const page = pdf.addPage([width, height]);
    page.drawImage(base, { x: 0, y: 0, width, height });
    page.drawRectangle({
      x: plaque.x,
      y: plaque.y,
      width: plaque.w,
      height: plaque.h,
      color: CREAM,
    });

    const tableLine = plaqueText(input.tableNo, seat.seat, seatNumbers);
    const tableSize = fittedSize(tableLine, font, plaque.w * 0.88, 30);
    drawCentered(page, tableLine, font, {
      cx: plaque.x + plaque.w / 2,
      y: plaque.y + plaque.h * 0.26,
      size: tableSize,
      color: PLAQUE_GOLD,
    });

    const byline = ticketByline(seat.name, input.ref);
    const bylineSize = fittedSize(byline, font, width * 0.66, 14);
    drawCentered(page, byline, font, {
      cx: width * 0.445,
      y: plaque.y - height * 0.044,
      size: bylineSize,
      color: BYLINE_GOLD,
    });

    const qrSize = 48;
    const qrX = width * 0.888;
    const qrY = height * 0.325;
    const pad = 3;
    page.drawRectangle({
      x: qrX - pad,
      y: qrY - pad,
      width: qrSize + pad * 2,
      height: qrSize + pad * 2,
      color: QR_BACK,
    });
    page.drawImage(qr, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  }

  return pdf.save({ useObjectStreams: true });
}

export function ticketPdfFilename(ref: string): string {
  return `${ref.trim()}-tickets.pdf`;
}
