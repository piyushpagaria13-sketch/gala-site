-- Locked RPC create_booking.
-- Requires 01_schema.sql and 04_comp_seats.sql (reads students.comp_seats).
--
-- 1. row lock on the target table
-- 2. recount remaining seats (derived: 10 minus sum of party sizes of
--    non-cancelled bookings)
-- 3. reject if party > remaining OR table is blocked
-- 4. reject if bus_seats > party_size or cars > party_size
-- 5. read comp_seats server-side; amount = max(party − comps, 0) × 218
--    (ignores any client-sent price)
-- 6. insert booking + guests; status paid and amount 0 when nothing is payable
-- 7. generate ref GALA-NNNN and return it

create or replace function create_booking(
  p_table_no integer,
  p_party_size integer,
  p_student_id uuid,
  p_guests jsonb,
  p_cars integer,
  p_bus_seats integer,
  p_contact text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocked boolean;
  v_booked integer;
  v_remaining integer;
  v_comp integer := 0;
  v_payable integer;
  v_amount integer;
  v_status text;
  v_ref text;
  v_booking_id uuid;
  v_guest jsonb;
  v_i integer := 0;
  v_seat_price integer := 218;
  v_capacity integer := 10;
begin
  if p_party_size is null or p_party_size < 1 then
    raise exception 'invalid party_size';
  end if;

  if coalesce(p_bus_seats, 0) > p_party_size then
    raise exception 'bus_seats exceeds party_size';
  end if;

  if coalesce(p_cars, 0) > p_party_size then
    raise exception 'cars exceeds party_size';
  end if;

  select blocked into v_blocked
  from tables
  where table_no = p_table_no
  for update;

  if not found then
    raise exception 'unknown table';
  end if;

  if v_blocked then
    raise exception 'capacity:%', p_table_no;
  end if;

  select coalesce(sum(party_size), 0) into v_booked
  from bookings
  where table_no = p_table_no
    and status is distinct from 'cancelled';

  v_remaining := v_capacity - v_booked;
  if p_party_size > v_remaining then
    raise exception 'capacity:%', p_table_no;
  end if;

  if p_student_id is not null then
    select coalesce(comp_seats, 0) into v_comp
    from students
    where id = p_student_id;

    if not found then
      raise exception 'unknown student';
    end if;
  end if;

  v_payable := greatest(p_party_size - v_comp, 0);
  v_amount := v_payable * v_seat_price;
  v_status := case when v_amount = 0 then 'paid' else 'awaiting_payment' end;
  v_ref := 'GALA-' || lpad(nextval('booking_ref_seq')::text, 4, '0');

  insert into bookings (
    ref, status, table_no, party_size, student_id,
    amount, cars, bus_seats, contact, email
  )
  values (
    v_ref, v_status, p_table_no, p_party_size, p_student_id,
    v_amount, coalesce(p_cars, 0), coalesce(p_bus_seats, 0),
    p_contact, p_email
  )
  returning id into v_booking_id;

  if p_guests is not null then
    for v_guest in select value from jsonb_array_elements(p_guests)
    loop
      insert into guests (
        booking_id, name, age, dietary, allergy_note, sort_order
      )
      values (
        v_booking_id,
        coalesce(v_guest->>'name', ''),
        nullif(v_guest->>'age', ''),
        nullif(v_guest->>'dietary', ''),
        nullif(v_guest->>'allergy_note', ''),
        v_i
      );
      v_i := v_i + 1;
    end loop;
  end if;

  return jsonb_build_object(
    'ref', v_ref,
    'amount', v_amount,
    'status', v_status,
    'id', v_booking_id
  );
end;
$$;

revoke all on function create_booking(
  integer, integer, uuid, jsonb, integer, integer, text, text
) from public;
grant execute on function create_booking(
  integer, integer, uuid, jsonb, integer, integer, text, text
) to anon, authenticated, service_role;
