/**
 * Two live bookings per graduate. A third shows NAME_ALREADY_BOOKED_MESSAGE.
 * No local imports so node:test can load this.
 * Contact address matches PA_CONTACT_EMAIL in lib/config.ts.
 */
export const MAX_LIVE_BOOKINGS_PER_STUDENT = 2;

export function liveBookingLimitReached(liveCount: number): boolean {
  return liveCount >= MAX_LIVE_BOOKINGS_PER_STUDENT;
}

export const NAME_ALREADY_BOOKED_MESSAGE =
  "You have already used this name to book tickets. To make any changes, please contact Padovergraduation@gapps.uwcsea.edu.sg.";
