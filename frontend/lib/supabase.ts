import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Created on first use so the build does not fail if the keys are not set yet.
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to frontend/.env.local and restart npm run dev."
    );
  }
  client = createClient(url, key);
  return client;
}
