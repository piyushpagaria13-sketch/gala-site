/**
 * Hours named in the payment-reminder email. There is no auto-cancel job
 * yet; change this when that window is decided.
 */
export const REMINDER_DEADLINE_HOURS = 48;

/** From header for every Resend message. Domain galauwcseadover.com is verified. */
export const SENDER_ADDRESS =
  "UWCSEA Dover Graduation Gala <no-reply@galauwcseadover.com>";

/** Replies and the footer mailto go here. This mailbox is monitored. */
export const PA_CONTACT_EMAIL = "Padovergraduation@gapps.uwcsea.edu.sg";

/** When true, cancelling a booking also emails the family. */
export const CONFIRM_CANCEL_EMAIL = true;

export function emailFooterText(): string {
  return `This mailbox isn't monitored — for any questions about your booking, email us at ${PA_CONTACT_EMAIL} or speak to your Grade Rep.`;
}

export function emailFooterHtml(): string {
  return `<p style="margin-top:28px;font-size:13px;line-height:1.5;color:#9a7f3e;">This mailbox isn't monitored — for any questions about your booking, email us at <a href="mailto:${PA_CONTACT_EMAIL}" style="color:#d4af37;">${PA_CONTACT_EMAIL}</a> or speak to your Grade Rep.</p>`;
}

/**
 * Shown when a matched student has complimentary seats.
 */
export const COMP_MODAL_COPY = {
  title: "Complimentary seats included",
  body: "This student's booking includes complimentary tickets, courtesy of the PA.",
};
