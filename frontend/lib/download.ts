"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// Sample stems from the seed data point at example.com, not at a stored file.
export function hasStoredFile(fileUrl: string): boolean {
  return !!fileUrl && !fileUrl.startsWith("http");
}

// Asks Supabase for a short-lived link. The database only allows this for the
// owner or someone with an active license.
export async function downloadStem(path: string): Promise<void> {
  const { data, error } = await supabaseBrowser()
    .storage.from("stems")
    .createSignedUrl(path, 60, { download: true });
  if (error || !data) throw new Error(error?.message ?? "Could not create the download link");
  window.location.assign(data.signedUrl);
}
