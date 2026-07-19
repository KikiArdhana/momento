export function formatDate(iso: string): string {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-US",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export function formatMonth(iso: string): string {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-US",
    { month: "long" },
  );
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = -1;
  do {
    value /= 1024;
    i++;
  } while (value >= 1024 && i < units.length - 1);
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

export function daysSince(iso: string): number {
  const start = new Date(iso + "T00:00:00").getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}
