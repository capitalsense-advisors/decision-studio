export function freshnessWarning(date: string | null | undefined, now = new Date(), maximumDays = 7) {
  const timestamp = date ? Date.parse(date) : NaN;
  if (!Number.isFinite(timestamp)) return "Data date is unavailable; freshness cannot be verified.";
  const age = (now.getTime() - timestamp) / 86_400_000;
  if (age < -1) return "Data date is in the future; verify the source.";
  return age > maximumDays ? `Data is more than ${maximumDays} calendar days old. Verify a recent price or NAV before deciding.` : null;
}
