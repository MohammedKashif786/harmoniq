"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// One shared browser client. It keeps the login session in the browser.
export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }
  return client;
}
