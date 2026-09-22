-- Complimentary seats on the graduating student.
-- Run after 01_schema.sql. Student rows live in 03_seed.sql.

alter table students
  add column if not exists comp_seats integer not null default 0;
