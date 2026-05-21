import { createClient } from "@supabase/supabase-js";

// Publishable Supabase credentials for the Progresstrade project. These are
// designed to be safe to expose in client code; data access is meant to be
// protected at the database level via RLS policies. They are kept here as a
// fallback so the app works without runtime env configuration. Setting
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY overrides them.
const DEFAULT_URL = "https://mhpngjwyzmsxdgakaszg.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_I9kPMso9Hyt7p4M1jxMM1Q_o7Sf3SDD";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export const INVOICE_BUCKET = "tm-invoices";

export function invoicePhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(INVOICE_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
