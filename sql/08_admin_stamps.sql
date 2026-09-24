-- Stamps for the bookings admin. Does not touch students or tables.
-- sql/07_class_students.sql already exists, so this is 08.
-- Paste into the Supabase SQL editor:
--   alter table bookings add column if not exists ticket_sent_at timestamptz, add column if not exists reminder_sent_at timestamptz, add column if not exists cancelled_at timestamptz;

alter table bookings
  add column if not exists ticket_sent_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists cancelled_at timestamptz;
