"use client";

import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_URL = "https://mhpngjwyzmsxdgakaszg.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_I9kPMso9Hyt7p4M1jxMM1Q_o7Sf3SDD";

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY
  );
}
