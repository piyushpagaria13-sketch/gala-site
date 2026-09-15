# Gala Booking

Website for the UWCSEA Dover Class of 2027 Graduation Gala Dinner (organised by the Parents' Association).

Two parts:

1. A one-pager marketing site (hero, highlights, banner, FAQ accordion, footer)
2. A booking flow at `/book` (webview-style, 800×832 content frame, one decision per screen)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres) via `@supabase/supabase-js`
- Deployed on Vercel later; Google Sheets sync later
- No auth for users; a simple password-protected `/admin` later

## Build plan

Night 1: run 01+02+03 in Supabase, make race.test.ts pass. STOP when green.

Night 2: StudentSearch (search students table, select-to-validate; fallback to free text + grade dropdown if students table is empty) + flow skeleton.

Night 3: TableMap with live derived counts, popover ("N of 10 filled", "Choose this table"), error when party > seats left. States: available (gold ring), sold out (dim fill), blocked (dashed). No legend.

Night 4: Review (parking + shuttle bus as dashed optional cards → modals), PayNow QR + reference + "I've paid" (sets claims_paid), confirmation screen polls status → shows success; PAYMENT PENDING badge until 'paid'.

Night 5: Google Sheets one-way export, polish, dress rehearsal.

Deferred: emails, auto-cancel cron, admin page.
