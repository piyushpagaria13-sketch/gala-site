import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// TODO: split browser (anon) vs server (service role) clients.
// TODO: wire SUPABASE_URL + SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY from env.
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}
