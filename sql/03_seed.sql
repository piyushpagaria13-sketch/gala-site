-- Re-runnable student seed. Paste into the Supabase SQL editor after
-- 01_schema.sql (comp_seats is added here if 04_comp_seats.sql has not run).
-- Wipes existing students (and bookings that reference them) then inserts
-- the 10 Class of 2027 names.

alter table students
  add column if not exists comp_seats integer not null default 0;

truncate table students restart identity cascade;

insert into students (name, grade, comp_seats) values
  ('Aryan Tan', '12', 2),
  ('Aryan Mehta', '12', 2),
  ('Mei Ling Wong', '12', 2),
  ('Zara Binte Rahman', '12', 0),
  ('Joshua Lim', '12', 0),
  ('Priya Krishnan', '12', 0),
  ('Min-Jun Park', '12', 0),
  ('Chloe Van Der Berg', '12', 0),
  ('Kabir Shah', '12', 0),
  ('Isabella Chen', '12', 0);
