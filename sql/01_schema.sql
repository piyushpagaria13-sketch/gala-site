-- Seats remaining is NEVER stored — always derived: 10 minus sum of
-- party sizes of non-cancelled bookings.
--
-- Run order: 01_schema.sql → 04_comp_seats.sql → 03_seed.sql
--            → 02_create_booking.sql

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text
);

create table if not exists tables (
  table_no integer primary key,
  blocked boolean not null default false
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  status text not null check (
    status in ('awaiting_payment', 'claims_paid', 'paid', 'cancelled')
  ),
  table_no integer not null references tables (table_no),
  party_size integer not null check (party_size > 0),
  student_id uuid references students (id),
  amount integer not null default 0,
  cars integer not null default 0 check (cars >= 0),
  bus_seats integer not null default 0 check (bus_seats >= 0),
  contact text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  name text not null,
  age text,
  dietary text,
  allergy_note text,
  sort_order integer not null default 0
);

insert into tables (table_no, blocked)
select g, g in (6, 15, 88)
from generate_series(1, 100) as g
on conflict (table_no) do nothing;

create sequence if not exists booking_ref_seq start 1;

alter table students enable row level security;
alter table tables enable row level security;
alter table bookings enable row level security;
alter table guests enable row level security;

drop policy if exists students_select on students;
create policy students_select on students
  for select to anon, authenticated
  using (true);

drop policy if exists tables_select on tables;
create policy tables_select on tables
  for select to anon, authenticated
  using (true);

drop policy if exists bookings_select on bookings;
create policy bookings_select on bookings
  for select to anon, authenticated
  using (true);

-- The only client-reachable post-commit update: email, matched by ref
-- in the application's update query. Column grant below blocks other fields.
drop policy if exists bookings_update_email on bookings;
create policy bookings_update_email on bookings
  for update to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on students, tables, bookings to anon, authenticated;
grant all on students, tables, bookings, guests to service_role;
grant usage, select on sequence booking_ref_seq to anon, authenticated, service_role;

revoke insert, update, delete on bookings from anon, authenticated;
grant select on bookings to anon, authenticated;
grant update (email) on bookings to anon, authenticated;
revoke all on guests from anon, authenticated;
