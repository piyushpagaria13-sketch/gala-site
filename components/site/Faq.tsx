"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * FAQ section — Figma frames "FAQ / all closed" (262:303) and
 * "FAQ / Q1..Q9 open" (259:15, 261:15, 261:87, 261:159, 261:231,
 * 262:15, 262:87, 262:159, 262:231).
 * Accordion: all items start closed; clicking a question toggles it,
 * with one item open at a time (matching the designs).
 */

const FAQ_ITEMS = [
  {
    question: "When and where is the Gala Dinner?",
    answer:
      "Saturday, 22 May 2027 at the Fairmont Ballroom, Raffles City Convention Centre, 80 Bras Basah Road. Doors open at 7:30 PM, with dinner served from 8:00 PM. The evening runs until midnight.",
  },
  {
    question: "Who organises the Gala?",
    answer:
      "The Graduation Gala Dinner is organised by the UWCSEA Dover Parents' Association (PA), together with the Class of 2027 Grade Reps.",
  },
  {
    question: "How much are tickets?",
    answer:
      "S$218 per seat, or S$2,180 for a full table of 10. There is no booking fee. The price covers the sit-down dinner, champagne toast (non-alcoholic options included), photo booths and the DJ.",
  },
  {
    question: "Who do I book under?",
    answer:
      "Every booking is made under the graduating student's name. Start typing their name on the booking page and select it. Family and the graduate themselves are then added as guests within that one booking.",
  },
  {
    question: "Can we choose our table and sit with friends?",
    answer:
      "Yes — the booking page shows a live map of all 100 tables. Tap any open table to see how many of its 10 seats are left, and choose it for your group. To sit with friends, agree on a table and book while seats remain, or take neighbouring tables.",
  },
  {
    question: "How do I pay?",
    answer:
      "By PayNow. After confirming your seats you'll see a QR code and a booking reference (e.g. GALA-0231). Add the reference to your transfer so the PA can match your payment — your booking is confirmed once it's verified.",
  },
  {
    question: "What about dietary requirements?",
    answer:
      "You'll choose a dietary option for each guest while booking — vegetarian, vegan, halal, gluten-free or none — and can note any allergies so the kitchen can plan for them.",
  },
  {
    question: "Is there parking or a shuttle?",
    answer:
      "Raffles City has on-site parking, and you can request parking passes or shuttle bus seats while reviewing your booking. [Placeholder — confirm arrangements from the PA doc.]",
  },
  {
    question: "What's the dress code, and can I get a refund?",
    answer:
      "Formal — black tie optional. [Placeholder — confirm refund policy and deadline from the PA doc.] Contact your Grade Rep for changes or transfers.",
  },
];

// Decorative sparkles — positions from the 1280×~1200 Figma frame, as percentages.
const SPARKLES = [
  { left: "11.7%", top: "5%", size: 3, variant: 1 },
  { left: "77.3%", top: "9%", size: 2, variant: 2 },
  { left: "91.4%", top: "17%", size: 4, variant: 3 },
  { left: "6.3%", top: "23%", size: 2, variant: 2 },
  { left: "84.4%", top: "63%", size: 3, variant: 1 },
  { left: "14.1%", top: "75%", size: 2, variant: 2 },
  { left: "94.5%", top: "85%", size: 2, variant: 2 },
  { left: "4.7%", top: "96%", size: 3, variant: 1 },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative flex flex-col items-center overflow-hidden px-4 pb-[88px] pt-[80px]"
      style={{
        background:
          "linear-gradient(to bottom, var(--navy-bg) 0%, var(--navy-mid) 55%, var(--navy-bg) 100%)",
      }}
    >
      {SPARKLES.map((s, i) => (
        <Image
          key={i}
          src={`/faq/sparkle-${s.variant}.svg`}
          alt=""
          width={s.size}
          height={s.size}
          className="pointer-events-none absolute"
          style={{ left: s.left, top: s.top }}
        />
      ))}

      <p className="text-[13px] font-medium tracking-[2.6px] text-[#c9a648]">
        GOOD TO KNOW
      </p>
      <h2
        className="mt-[14px] bg-clip-text text-center font-display text-3xl font-semibold text-transparent sm:text-[44px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #f3dc9a 0%, #d4af37 55%, #a87f1f 100%)",
        }}
      >
        Frequently Asked Questions
      </h2>
      <p className="mt-[10px] text-center text-[17px] text-[#8fa0bd]">
        Everything about the evening, booking and payment.
      </p>

      <div className="mt-[28px] flex items-center gap-3" aria-hidden>
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold" />
        <span className="text-[14px] text-gold">✦</span>
        <div className="h-px w-16 bg-gradient-to-r from-gold to-transparent" />
      </div>

      <div className="mt-[38px] flex w-full max-w-[620px] flex-col gap-3">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.question}
              className={
                isOpen
                  ? "rounded-card border border-gold bg-card shadow-[0px_0px_0px_3px_rgba(212,175,55,0.18),0px_10px_30px_0px_rgba(0,0,0,0.35)]"
                  : "rounded-card border border-white bg-card"
              }
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-[22px] py-5 text-left"
              >
                <span className="text-[16px] font-semibold leading-[1.4] text-ink">
                  {item.question}
                </span>
                <Image
                  src={isOpen ? "/faq/toggle-open.svg" : "/faq/toggle-closed.svg"}
                  alt=""
                  width={34}
                  height={34}
                  className="shrink-0"
                />
              </button>
              {isOpen && (
                <div className="px-[22px] pb-[22px]">
                  <p className="text-[15px] leading-[1.65] text-ink-soft">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 px-4 text-center text-[14px] text-[#8fa0bd]">
        Still have a question? Your Grade Rep is the fastest route — or email{" "}
        <a
          href="mailto:gala2027@example.edu.sg"
          className="text-gold underline [text-underline-position:from-font]"
        >
          gala2027@example.edu.sg
        </a>
      </p>
    </section>
  );
}
