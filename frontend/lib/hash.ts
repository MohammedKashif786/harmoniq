// SHA-256 of a file or text, as a hex string. Used as the exact-match
// fingerprint ("Proof-of-Stem v0") until Chromaprint is added.
export async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const buffer: ArrayBuffer =
    typeof data === "string" ? (new TextEncoder().encode(data).buffer as ArrayBuffer) : data;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
