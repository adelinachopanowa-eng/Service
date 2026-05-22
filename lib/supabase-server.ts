import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const DEFAULT_URL = "https://mhpngjwyzmsxdgakaszg.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_I9kPMso9Hyt7p4M1jxMM1Q_o7Sf3SDD";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Auth refresh happens in middleware, so this is safe to ignore.
        }
      },
    },
  });
}
