import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confirmationBadge,
  confirmationSubtitle,
  confirmationTone,
  reviewCtaLabel,
  showPaymentProofBanner,
} from "../lib/confirmationCopy.ts";

test("complimentary bookings confirm instead of reading as paid", () => {
  const tone = confirmationTone({
    compSeats: 2,
    amount: 0,
    bookingStatus: "paid",
  });
  assert.equal(tone, "complimentary");
  assert.equal(confirmationBadge(tone), "CONFIRM");
  assert.match(confirmationSubtitle(tone), /tickets are confirmed/i);
  assert.equal(showPaymentProofBanner(tone), false);
  assert.equal(reviewCtaLabel(0), "Confirm");
});

test("paying families still see pending or paid", () => {
  assert.equal(
    confirmationTone({
      compSeats: 0,
      amount: 654,
      bookingStatus: "claims_paid",
    }),
    "pending",
  );
  assert.equal(
    confirmationBadge(
      confirmationTone({
        compSeats: 0,
        amount: 654,
        bookingStatus: "paid",
      }),
    ),
    "PAID",
  );
  assert.equal(reviewCtaLabel(1), "Confirm & pay");
  assert.equal(showPaymentProofBanner("pending"), true);
});
