/** A YYYY-MM-DD Nicaragua calendar day maps to [06:00 UTC, 06:00 UTC next day). */
export function paymentDayWindow(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [year, month, date] = day.split("-").map(Number);
  if (year < 1000 || year > 9999) return null;
  const start = new Date(Date.UTC(year, month - 1, date, 6));
  if (start.toISOString().slice(0, 10) !== day) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
