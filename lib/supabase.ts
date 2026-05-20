import { createClient } from "@supabase/supabase-js";

// Fallback to placeholder values so that builds (e.g. on Netlify) do not
// fail when env vars are not yet configured. Real values must be provided
// at runtime via NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
