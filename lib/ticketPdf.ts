import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDict, PDFDocument, PDFFont, PDFName, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { PNG } from "pngjs";
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

/**
 * Allowed overwrite window as fractions of the base image. Inset from the
 * user-provided inner panel so the gold frame, top ornament, and bottom
 * flourish never change.
 */
export const PLAQUE_REGION = {
  x0: 0.232,
  x1: 0.668,
  y0: 0.748,
  y1: 0.821,
  radius: 7,
};

const CREAM_TOP = [241, 226, 197] as const;
const CREAM_MID = [242, 227, 198] as const;
const CREAM_BOT = [237, 221, 190] as const;
const NAVY = rgb(28 / 255, 36 / 255, 56 / 255);
const BYLINE_GOLD = rgb(0.83, 0.686, 0.216);
const PAGE_BG = rgb(11 / 255, 14 / 255, 22 / 255);
const MARGIN = 72;

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

function inRoundedRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): boolean {
  if (px < x || py < y || px >= x + w || py >= y + h) return false;
  const rad = Math.min(r, w / 2, h / 2);
  const cxLeft = x + rad;
  const cxRight = x + w - rad;
  const cyTop = y + rad;
  const cyBot = y + h - rad;
  let dx = 0;
  let dy = 0;
  if (px < cxLeft) dx = px + 0.5 - cxLeft;
  else if (px >= cxRight) dx = px + 0.5 - cxRight;
  if (py < cyTop) dy = py + 0.5 - cyTop;
  else if (py >= cyBot) dy = py + 0.5 - cyBot;
  if (dx === 0 || dy === 0) return true;
  return dx * dx + dy * dy <= rad * rad;
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function creamAt(t: number): [number, number, number] {
  if (t < 0.5) {
    const u = t / 0.5;
    return [
      lerpChannel(CREAM_TOP[0], CREAM_MID[0], u),
      lerpChannel(CREAM_TOP[1], CREAM_MID[1], u),
      lerpChannel(CREAM_TOP[2], CREAM_MID[2], u),
    ];
  }
  const u = (t - 0.5) / 0.5;
  return [
    lerpChannel(CREAM_MID[0], CREAM_BOT[0], u),
    lerpChannel(CREAM_MID[1], CREAM_BOT[1], u),
    lerpChannel(CREAM_MID[2], CREAM_BOT[2], u),
  ];
}

/** Clone the base PNG and repaint only the inner cream plaque. */
export function paintPlaque(basePng: Buffer | Uint8Array): Buffer {
  const src = PNG.sync.read(Buffer.from(basePng));
  const out = new PNG({ width: src.width, height: src.height });
  src.data.copy(out.data);
  const { width, height } = src;
  const x = Math.round(width * PLAQUE_REGION.x0);
  const y = Math.round(height * PLAQUE_REGION.y0);
  const w = Math.round(width * PLAQUE_REGION.x1) - x;
  const h = Math.round(height * PLAQUE_REGION.y1) - y;
  const r = PLAQUE_REGION.radius;
  for (let py = y; py < y + h; py++) {
    const t = h <= 1 ? 0 : (py - y) / (h - 1);
    const [cr, cg, cb] = creamAt(t);
    for (let px = x; px < x + w; px++) {
      if (!inRoundedRect(px, py, x, y, w, h, r)) continue;
      const i = (py * width + px) * 4;
      out.data[i] = cr;
      out.data[i + 1] = cg;
      out.data[i + 2] = cb;
      out.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(out);
}

export function countPixelsChangedOutsidePlaque(
  original: Buffer | Uint8Array,
  painted: Buffer | Uint8Array,
): number {
  const a = PNG.sync.read(Buffer.from(original));
  const b = PNG.sync.read(Buffer.from(painted));
  const x0 = Math.round(a.width * PLAQUE_REGION.x0);
  const x1 = Math.round(a.width * PLAQUE_REGION.x1);
  const y0 = Math.round(a.height * PLAQUE_REGION.y0);
  const y1 = Math.round(a.height * PLAQUE_REGION.y1);
  let changed = 0;
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      if (x >= x0 && x < x1 && y >= y0 && y < y1) continue;
      const i = (y * a.width + x) * 4;
      if (
        a.data[i] !== b.data[i] ||
        a.data[i + 1] !== b.data[i + 1] ||
        a.data[i + 2] !== b.data[i + 2]
      ) {
        changed += 1;
      }
    }
  }
  return changed;
}

async function loadSerif(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  for (const file of [
    "fonts/PlayfairDisplaySC-SemiBold.ttf",
    "fonts/PlayfairDisplay-SemiBold.ttf",
    "fonts/PlayfairDisplay.ttf",
  ]) {
    try {
      return await pdf.embedFont(await readPublic(file), { subset: false });
    } catch {
      /* try the next cut */
    }
  }
  return pdf.embedFont(StandardFonts.TimesRoman);
}

function fittedSize(
  text: string,
  font: EmbeddedFont,
  maxWidth: number,
  preferred: number,
): number {
  let size = preferred;
  while (size > 8 && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawCenteredString(
  page: PDFPage,
  text: string,
  font: EmbeddedFont,
  opts: { cx: number; y: number; size: number; color: ReturnType<typeof rgb> },
) {
  const parts = text.split(" ").filter(Boolean);
  const gap = opts.size * 0.42;
  const widths = parts.map((part) => font.widthOfTextAtSize(part, opts.size));
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, parts.length - 1);
  let x = opts.cx - total / 2;
  parts.forEach((part, index) => {
    page.drawText(part, {
      x,
      y: opts.y,
      size: opts.size,
      font,
      color: opts.color,
    });
    x += widths[index] + gap;
  });
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
  const rawBase = Buffer.from(await readPublic("ticket-base.png"));
  const painted = paintPlaque(rawBase);
  const [face, font, qrPng] = await Promise.all([
    pdf.embedPng(painted),
    loadSerif(pdf),
    QRCode.toBuffer(input.ref, {
      type: "png",
      margin: 1,
      width: 96,
      errorCorrectionLevel: "M",
      color: { dark: "#e8d9a8", light: "#0b0e16" },
    }),
  ]);
  const qr = await pdf.embedPng(qrPng);
  const imgW = face.width;
  const imgH = face.height;
  const pageW = imgW;
  const pageH = imgH + MARGIN;

  const plaqueX = imgW * PLAQUE_REGION.x0;
  const plaqueW = imgW * (PLAQUE_REGION.x1 - PLAQUE_REGION.x0);
  const plaqueH = imgH * (PLAQUE_REGION.y1 - PLAQUE_REGION.y0);
  const plaquePdfY = MARGIN + imgH * (1 - PLAQUE_REGION.y1);
  const cap = imgH * 0.05;

  for (const seat of seats) {
    const page = pdf.addPage([pageW, pageH]);
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: PAGE_BG });
    page.drawImage(face, { x: 0, y: MARGIN, width: imgW, height: imgH });

    const tableLine = plaqueText(input.tableNo, seat.seat, seatNumbers);
    const tableSize = fittedSize(tableLine, font, plaqueW * 0.92, cap);
    const tracking = tableSize * 0.08;
    let stamped = 0;
    for (const char of tableLine) {
      stamped +=
        char === " "
          ? tableSize * 0.38
          : font.widthOfTextAtSize(char, tableSize) + tracking;
    }
    stamped -= tracking;
    let tx = plaqueX + (plaqueW - stamped) / 2;
    const ty = plaquePdfY + (plaqueH - tableSize * 0.75) / 2;
    for (const char of tableLine) {
      if (char !== " ") {
        page.drawText(char, { x: tx, y: ty, size: tableSize, font, color: NAVY });
        tx += font.widthOfTextAtSize(char, tableSize) + tracking;
      } else {
        tx += tableSize * 0.38;
      }
    }

    const byline = ticketByline(seat.name, input.ref);
    const bylineSize = fittedSize(byline, font, pageW * 0.7, 13);
    drawCenteredString(page, byline, font, {
      cx: pageW * 0.48,
      y: MARGIN * 0.38,
      size: bylineSize,
      color: BYLINE_GOLD,
    });

    const qrSize = 40;
    page.drawImage(qr, {
      x: pageW - qrSize - 18,
      y: (MARGIN - qrSize) / 2,
      width: qrSize,
      height: qrSize,
    });
  }

  return pdf.save({ useObjectStreams: true });
}

export function ticketPdfFilename(ref: string): string {
  return `${ref.trim()}-tickets.pdf`;
}
