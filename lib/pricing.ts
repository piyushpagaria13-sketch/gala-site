/** Per-seat ticket price in SGD. Whole-table = 10 × SEAT_PRICE. */
export const SEAT_PRICE = 218;

/** Seats the booker actually pays for after complimentary seats. */
export function payableSeats(party: number, compSeats: number): number {
  return Math.max(party - compSeats, 0);
}

/** Payable total in SGD. */
export function bookingTotal(party: number, compSeats: number): number {
  return payableSeats(party, compSeats) * SEAT_PRICE;
}
