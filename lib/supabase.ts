import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_* env must be referenced statically (process.env.NAME written
// out in full) so Next.js can inline the values into browser bundles.
// A dynamic process.env[name] lookup is always undefined in the browser.

/** Browser / RLS client — publishable key only. */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return createClient(url, key);
}

/** Server-only client — secret key. Do not import from client components. */
export function getSupabaseServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SECRET_KEY");
  return createClient(url, key);
}
