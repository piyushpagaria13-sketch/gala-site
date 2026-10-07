/** Per-seat ticket price in SGD. Whole-table = 10 × SEAT_PRICE. */
export const SEAT_PRICE = 218;

/** Only the graduate's own seat is waived, even if the roster still stores 2. */
export const MAX_APPLIED_COMP_SEATS = 1;

export function appliedCompSeats(compSeats: number): number {
  return Math.min(Math.max(compSeats, 0), MAX_APPLIED_COMP_SEATS);
}

/** Seats the booker actually pays for after complimentary seats. */
export function payableSeats(party: number, compSeats: number): number {
  return Math.max(party - appliedCompSeats(compSeats), 0);
}

/** Payable total in SGD. */
export function bookingTotal(party: number, compSeats: number): number {
  return payableSeats(party, compSeats) * SEAT_PRICE;
}
