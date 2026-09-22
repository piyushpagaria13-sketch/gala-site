-- Three name forms on students: preferred, official, family.
-- Display convention (in code): preferred_name || ' ' || family_name.
-- Re-runnable. Run after 01_schema.sql / 04_comp_seats.sql.

alter table students
  add column if not exists preferred_name text,
  add column if not exists official_name text,
  add column if not exists family_name text;

-- Migrate the legacy single name column into preferred_name.
update students
set preferred_name = name
where preferred_name is null;
