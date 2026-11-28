import { supabaseBrowser } from "@/lib/supabaseBrowser";

// Address of the Harmoniq backend (the server that holds the platform wallet).
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

// Calls the backend as the logged-in person by sending their Supabase access token.
export async function backendPost<T>(path: string, body?: unknown): Promise<T> {
  if (!BACKEND_URL) {
    throw new Error("The minting service is not set up (NEXT_PUBLIC_BACKEND_URL is missing).");
  }
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please log in again.");

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}
