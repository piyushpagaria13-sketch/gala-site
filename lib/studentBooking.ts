/**
 * Regular graduates: two live bookings; a third shows NAME_ALREADY_BOOKED_MESSAGE.
 * Reserved complimentary recipients: one live booking.
 * No local imports so node:test can load this.
 * Contact address matches PA_CONTACT_EMAIL in lib/config.ts.
 */
export const MAX_LIVE_BOOKINGS_PER_STUDENT = 2;
export const MAX_LIVE_BOOKINGS_RESERVED = 1;

export function maxLiveBookings(reserved: boolean): number {
  return reserved ? MAX_LIVE_BOOKINGS_RESERVED : MAX_LIVE_BOOKINGS_PER_STUDENT;
}

export function liveBookingLimitReached(
  liveCount: number,
  reserved = false,
): boolean {
  return liveCount >= maxLiveBookings(reserved);
}

export const NAME_ALREADY_BOOKED_MESSAGE =
  "You have already used this name to book tickets. To make any changes, please contact Padovergraduation@gapps.uwcsea.edu.sg.";
