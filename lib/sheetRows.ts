/** Same value as TABLE_CAPACITY in lib/floorplan.ts. Inlined so this module has no local imports. */
const SEATS_PER_TABLE = 10;

/** Venue table numbers 1–100. The floor-plan drawing covers a subset of these. */
export const TABLE_COUNT = 100;

export type MirrorGuest = {
  name: string;
  age: string;
  dietary: string;
  allergyNote: string;
  sortOrder: number;
};

export type MirrorBooking = {
  ref: string;
  student: string;
  tableNo: number;
  partySize: number;
  cars: number;
  busSeats: number;
  contact: string;
  status: string;
  amount: number;
  /** Set once the guest asks for a copy. The sheet shows "Sent", not the address. */
  email: string;
  guests: MirrorGuest[];
};

export type MirrorTable = {
  tableNo: number;
  blocked: boolean;
};

export type SheetSnapshot = {
  tables: MirrorTable[];
  bookings: MirrorBooking[];
};

export type SheetTab = {
  title: string;
  rows: string[][];
  /** 0-based row indexes to bold, besides the frozen header. */
  boldRows: number[];
};

export const BOOKINGS_HEADER = [
  "Ref",
  "Student",
  "Table",
  "Seats",
  "Guest name",
  "Age",
  "Dietary",
  "Allergy note",
  "Cars",
  "Bus seats",
  "Contact",
  "Status",
  "Amount",
  "Email",
];

export const TABLES_HEADER = [
  "Guest",
  "Age",
  "Dietary",
  "Allergy",
  "Student booked under",
  "Ref",
  "Status",
  "Seats",
];

function activeBookings(snapshot: SheetSnapshot): MirrorBooking[] {
  return snapshot.bookings
    .filter((booking) => booking.status !== "cancelled")
    .slice()
    .sort((a, b) => a.ref.localeCompare(b.ref));
}

function guestsInOrder(booking: MirrorBooking): MirrorGuest[] {
  return booking.guests.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Tab 1 — one row per guest. Booking-level cells repeat on each guest row. */
export function bookingsTab(snapshot: SheetSnapshot): string[][] {
  const rows = activeBookings(snapshot).flatMap((booking) =>
    guestsInOrder(booking).map((guest) => [
      booking.ref,
      booking.student,
      String(booking.tableNo),
      String(booking.partySize),
      guest.name,
      guest.age,
      guest.dietary,
      guest.allergyNote,
      String(booking.cars),
      String(booking.busSeats),
      booking.contact,
      booking.status,
      String(booking.amount),
      booking.email ? "Sent" : "",
    ]),
  );
  return [BOOKINGS_HEADER, ...rows];
}

/**
 * Tab 2 — every table from 1 to 100. Filled seats are the sum of party_size
 * on non-cancelled bookings, never a stored counter.
 */
export function tablesTab(snapshot: SheetSnapshot): {
  rows: string[][];
  boldRows: number[];
} {
  const blocked = new Map(
    snapshot.tables.map((table) => [table.tableNo, table.blocked]),
  );
  const byTable = new Map<number, MirrorBooking[]>();
  for (const booking of activeBookings(snapshot)) {
    const list = byTable.get(booking.tableNo) ?? [];
    list.push(booking);
    byTable.set(booking.tableNo, list);
  }

  const rows: string[][] = [TABLES_HEADER];
  const boldRows: number[] = [];
  const blank = ["", "", "", "", "", "", ""];

  for (let tableNo = 1; tableNo <= TABLE_COUNT; tableNo++) {
    boldRows.push(rows.length);
    if (blocked.get(tableNo)) {
      rows.push([`Table ${tableNo} · BLOCKED`, ...blank]);
      continue;
    }

    const bookings = byTable.get(tableNo) ?? [];
    const filled = bookings.reduce((sum, booking) => sum + booking.partySize, 0);
    if (filled === 0) {
      rows.push([`Table ${tableNo} · — empty —`, ...blank]);
      continue;
    }

    const remaining = Math.max(SEATS_PER_TABLE - filled, 0);
    rows.push([
      `Table ${tableNo} · ${filled}/${SEATS_PER_TABLE} · ${remaining} left`,
      ...blank,
    ]);
    for (const booking of bookings) {
      for (const guest of guestsInOrder(booking)) {
        rows.push([
          guest.name,
          guest.age,
          guest.dietary,
          guest.allergyNote,
          booking.student,
          booking.ref,
          booking.status,
          String(booking.partySize),
        ]);
      }
    }
  }

  return { rows, boldRows };
}

const BOOKINGS_TAB = "Bookings";
const TABLES_TAB = "Tables & Seats";

/** Row rewrite shared by exportAll. Load and Sheets I/O stay in lib/sheetExport.ts. */
export async function exportSnapshot(overrides: {
  load: () => Promise<SheetSnapshot>;
  write: (tabs: SheetTab[]) => Promise<void>;
}): Promise<SheetTab[]> {
  const snapshot = await overrides.load();
  const tables = tablesTab(snapshot);
  const tabs: SheetTab[] = [
    { title: BOOKINGS_TAB, rows: bookingsTab(snapshot), boldRows: [] },
    { title: TABLES_TAB, rows: tables.rows, boldRows: tables.boldRows },
  ];
  await overrides.write(tabs);
  return tabs;
}

/** Header frozen + bold, summary rows bold, everything else reset so a rewrite can't drift. */
export function sheetFormatRequests(sheetId: number, boldRows: number[]) {
  const clearAndHeader = [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 2000,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        cell: { userEnteredFormat: { textFormat: { bold: false } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    },
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    },
  ];

  const summaries = boldRows
    .filter((row) => row > 0)
    .map((row) => ({
      repeatCell: {
        range: { sheetId, startRowIndex: row, endRowIndex: row + 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    }));

  return [...clearAndHeader, ...summaries];
}
