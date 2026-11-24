export function short(value: string | null | undefined, head = 6, tail = 4): string {
  if (!value) return "-";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}\u2026${value.slice(-tail)}`;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
