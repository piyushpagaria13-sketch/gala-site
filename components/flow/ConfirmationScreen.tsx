"use client";

import Image from "next/image";
import { useState } from "react";
import { sendBookingCopy } from "@/app/actions/sendBookingEmail";
import { partySeatCount, useBookingDraft } from "@/lib/bookingDraft";

/**
 * "You're booked!" — terminal screen after payment (or a fully complimentary
 * booking). Send stores the address, emails a copy, and marks the sheet Sent.
 */
export function ConfirmationScreen() {
  const { draft, setDraft } = useBookingDraft();
  const [email, setEmail] = useState(draft.contact?.email ?? "");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const seats = partySeatCount(draft);
  const names = draft.guests
    .map((g) => g.name.trim())
    .filter(Boolean)
    .join(" · ");
  const paid = draft.bookingStatus === "paid" || draft.amount === 0;

  const handleSend = async () => {
    const trimmed = email.trim();
    const ref = draft.bookingRef;
    if (!trimmed || !ref) return;
    setSending(true);
    setSendError(null);
    try {
      await sendBookingCopy(ref, trimmed);
      setDraft({
        ...draft,
        contact: { ...draft.contact, email: trimmed },
      });
      setSent(true);
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Could not save that email",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center px-4 pb-8 pt-[14px]">
      <div className="relative h-[76px] w-[76px]">
        <Image
          src="/book/icon-confirm-check.svg"
          alt=""
          width={148}
          height={148}
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <h1 className="mt-[18px] text-center font-display text-[30px] font-medium text-[#e3c46a]">
        You&apos;re booked!
      </h1>
      <p className="mt-2 text-center text-[15px] text-[#9a7f3e]">
        {paid
          ? "Your seats are reserved. No payment is due."
          : "Your seats are reserved. Payment will be verified by your Grade Rep."}
      </p>

      <div className="mt-4 flex w-full max-w-[480px] gap-3 rounded-[12px] border-[0.5px] border-[#3a2f18] bg-[#100d07] px-4 py-[13px]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[12px] bg-[#e5b52a] text-[14px] font-bold text-[#241a06]">
          !
        </span>
        <p className="text-[14px] leading-[1.5] text-[#9a7f3e]">
          Please share your screenshot on{" "}
          <span className="text-[19px] font-black leading-none text-[#ffe56a]">
            +6598193518
          </span>{" "}
          to receive the ticket.
        </p>
      </div>

      <div className="mt-[26px] w-full max-w-[480px] rounded-card border border-[#6e5a2b] bg-[#1a1610] px-7 py-6">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[32px] font-medium text-[#e8d9a8]">
            Table {draft.tableNo}
          </p>
          <p className="text-[13px]">
            <span className="text-[#9a7f3e]">Ref </span>
            <span className="font-medium text-[#c9a648]">
              {draft.bookingRef}
            </span>
          </p>
        </div>
        <p className="mt-2 text-[14px] text-[#9a7f3e]">
          {seats} {seats === 1 ? "seat" : "seats"} · Saturday 22 May 2027 · 7:30
          PM
        </p>
        <div className="mt-[14px] h-px w-full bg-[#3a2f18]" />
        <p className="mt-3 text-[15px] text-[#d9bd6f]">{names}</p>
        <span className="mt-[14px] inline-block rounded-pill bg-[#3a2f18] px-3 py-1 text-[11px] font-medium tracking-[0.66px] text-[#c9a648]">
          {paid ? "PAID" : "PAYMENT PENDING"}
        </span>
      </div>

      <div className="mt-[22px] flex w-full max-w-[480px] flex-col gap-[10px]">
        <p className="text-[15px] font-medium text-[#e8d9a8]">
          Send a copy to your email
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            placeholder="you@email.com"
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
            className="min-w-0 flex-1 rounded-[12px] border border-[#6e5a2b] bg-[#1a1610] px-4 py-[14px] text-[16px] text-[#e8d9a8] outline-none transition-colors placeholder:text-[#77633a] focus:border-gold"
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => void handleSend()}
            className="shrink-0 rounded-[12px] bg-gold px-[26px] py-[14px] text-[16px] font-semibold text-[#241a06] disabled:opacity-50"
          >
            {sent ? "Sent" : sending ? "Sending…" : "Send"}
          </button>
        </div>
        {sent && (
          <p className="text-[13px] text-[#9a7f3e]">
            A copy of your booking will be sent to {draft.contact?.email}.
          </p>
        )}
        {sendError && (
          <p className="text-[13px] text-[#e0937d]">{sendError}</p>
        )}
      </div>
    </div>
  );
}
