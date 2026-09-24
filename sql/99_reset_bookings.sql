-- Wipe every booking and its guests. Students and tables are left as they are.
-- Guests are deleted first so this still works if the cascade is removed.
-- Paste into the Supabase SQL editor:
--   delete from guests; delete from bookings;

delete from guests;
delete from bookings;
