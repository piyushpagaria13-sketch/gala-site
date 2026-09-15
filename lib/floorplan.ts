/**
 * Venue floorplan — data-driven so the room can be redrawn without touching
 * component code. Coordinates are percentages (0–100) of the map canvas.
 *
 * Traced from the venue's real floor plan image (1024×580): hexagonal
 * ballroom, central 24ft × 30ft dance floor, 95 round tables in two winged
 * arcs plus rows bridging above/below. Table centers were extracted from the
 * image programmatically, so positions match the plan exactly. Numbering
 * runs top → bottom, left → right in row bands.
 */

export type FloorTable = {
  tableNo: number;
  /** % of canvas width. */
  x: number;
  /** % of canvas height. */
  y: number;
};

export const TABLE_CAPACITY = 10;

/** Map canvas aspect, from the source floor plan image. */
export const CANVAS = { width: 1024, height: 580 };

/** Hexagonal room outline (SVG points in CANVAS space). */
export const ROOM_OUTLINE = "277,31 743,31 984,284 726,542 296,542 35,286";

/** Dance floor rect, in the same percentage space. */
export const DANCE_FLOOR = {
  x: 44.8, // left
  y: 37.1, // top
  width: 11.1,
  height: 36.4,
};

export const FLOORPLAN: FloorTable[] = [
  { tableNo: 1, x: 38.6, y: 15.4 },
  { tableNo: 2, x: 46.2, y: 16.4 },
  { tableNo: 3, x: 54.0, y: 16.4 },
  { tableNo: 4, x: 34.5, y: 19.9 },
  { tableNo: 5, x: 42.4, y: 19.2 },
  { tableNo: 6, x: 57.8, y: 19.2 },
  { tableNo: 7, x: 64.0, y: 17.8 },
  { tableNo: 8, x: 30.7, y: 24.2 },
  { tableNo: 9, x: 38.6, y: 23.1 },
  { tableNo: 10, x: 46.2, y: 24.2 },
  { tableNo: 11, x: 54.0, y: 24.2 },
  { tableNo: 12, x: 61.6, y: 23.1 },
  { tableNo: 13, x: 68.0, y: 22.5 },
  { tableNo: 14, x: 26.9, y: 29.1 },
  { tableNo: 15, x: 34.5, y: 27.0 },
  { tableNo: 16, x: 42.4, y: 27.0 },
  { tableNo: 17, x: 57.8, y: 27.0 },
  { tableNo: 18, x: 65.1, y: 27.8 },
  { tableNo: 19, x: 72.2, y: 27.7 },
  { tableNo: 20, x: 23.1, y: 33.1 },
  { tableNo: 21, x: 30.7, y: 33.1 },
  { tableNo: 22, x: 38.6, y: 30.9 },
  { tableNo: 23, x: 46.2, y: 32.0 },
  { tableNo: 24, x: 54.0, y: 32.0 },
  { tableNo: 25, x: 61.6, y: 30.9 },
  { tableNo: 26, x: 68.9, y: 33.1 },
  { tableNo: 27, x: 76.5, y: 33.1 },
  { tableNo: 28, x: 19.3, y: 37.0 },
  { tableNo: 29, x: 26.9, y: 37.0 },
  { tableNo: 30, x: 34.5, y: 37.0 },
  { tableNo: 31, x: 42.4, y: 34.8 },
  { tableNo: 32, x: 57.8, y: 34.8 },
  { tableNo: 33, x: 65.1, y: 37.0 },
  { tableNo: 34, x: 72.6, y: 37.0 },
  { tableNo: 35, x: 80.3, y: 37.0 },
  { tableNo: 36, x: 15.4, y: 41.4 },
  { tableNo: 37, x: 23.1, y: 40.9 },
  { tableNo: 38, x: 30.7, y: 40.9 },
  { tableNo: 39, x: 39.4, y: 40.9 },
  { tableNo: 40, x: 59.1, y: 43.0 },
  { tableNo: 41, x: 68.9, y: 40.9 },
  { tableNo: 42, x: 76.4, y: 40.9 },
  { tableNo: 43, x: 84.3, y: 40.8 },
  { tableNo: 44, x: 19.3, y: 44.8 },
  { tableNo: 45, x: 26.9, y: 44.8 },
  { tableNo: 46, x: 34.5, y: 44.8 },
  { tableNo: 47, x: 65.1, y: 44.8 },
  { tableNo: 48, x: 72.6, y: 44.7 },
  { tableNo: 49, x: 80.3, y: 44.8 },
  { tableNo: 50, x: 15.5, y: 49.2 },
  { tableNo: 51, x: 23.1, y: 48.7 },
  { tableNo: 52, x: 30.7, y: 48.7 },
  { tableNo: 53, x: 39.4, y: 50.3 },
  { tableNo: 54, x: 68.9, y: 48.6 },
  { tableNo: 55, x: 76.4, y: 48.7 },
  { tableNo: 56, x: 84.3, y: 48.6 },
  { tableNo: 57, x: 19.3, y: 52.6 },
  { tableNo: 58, x: 26.9, y: 52.6 },
  { tableNo: 59, x: 34.5, y: 52.5 },
  { tableNo: 60, x: 59.7, y: 51.4 },
  { tableNo: 61, x: 65.1, y: 52.5 },
  { tableNo: 62, x: 72.7, y: 52.5 },
  { tableNo: 63, x: 80.2, y: 52.5 },
  { tableNo: 64, x: 15.4, y: 57.0 },
  { tableNo: 65, x: 23.1, y: 56.4 },
  { tableNo: 66, x: 30.7, y: 56.4 },
  { tableNo: 67, x: 68.9, y: 56.4 },
  { tableNo: 68, x: 76.4, y: 56.4 },
  { tableNo: 69, x: 84.3, y: 56.4 },
  { tableNo: 70, x: 19.3, y: 60.4 },
  { tableNo: 71, x: 26.9, y: 60.4 },
  { tableNo: 72, x: 34.5, y: 60.4 },
  { tableNo: 73, x: 39.4, y: 61.0 },
  { tableNo: 74, x: 59.1, y: 61.8 },
  { tableNo: 75, x: 65.1, y: 60.3 },
  { tableNo: 76, x: 72.7, y: 60.3 },
  { tableNo: 77, x: 80.3, y: 60.3 },
  { tableNo: 78, x: 23.1, y: 64.2 },
  { tableNo: 79, x: 30.7, y: 64.2 },
  { tableNo: 80, x: 68.9, y: 64.2 },
  { tableNo: 81, x: 76.4, y: 64.2 },
  { tableNo: 82, x: 26.9, y: 68.1 },
  { tableNo: 83, x: 34.5, y: 68.1 },
  { tableNo: 84, x: 65.1, y: 68.1 },
  { tableNo: 85, x: 72.6, y: 68.1 },
  { tableNo: 86, x: 30.7, y: 72.0 },
  { tableNo: 87, x: 38.3, y: 73.3 },
  { tableNo: 88, x: 61.3, y: 73.3 },
  { tableNo: 89, x: 68.9, y: 72.0 },
  { tableNo: 90, x: 34.5, y: 75.9 },
  { tableNo: 91, x: 42.1, y: 77.2 },
  { tableNo: 92, x: 57.5, y: 77.2 },
  { tableNo: 93, x: 65.1, y: 75.9 },
  { tableNo: 94, x: 38.3, y: 81.1 },
  { tableNo: 95, x: 61.3, y: 81.1 },];
