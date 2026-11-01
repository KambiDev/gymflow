const managuaDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Managua",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Calendar-day boundaries in Nicaragua (UTC−06:00; no DST in the current operating period). */
export function dueDateWindow(now: Date) {
  const parts = managuaDate.formatToParts(now);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const today = new Date(
    Date.UTC(value("year"), value("month") - 1, value("day"), 6),
  );
  const afterSevenDays = new Date(today);
  afterSevenDays.setUTCDate(afterSevenDays.getUTCDate() + 7);
  return { today, afterSevenDays };
}
