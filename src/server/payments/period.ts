/** Periods are half-open [start, end); preserve the time of day in UTC. */
export function calculatePaymentPeriod(
  paidAt: Date,
  previousEnd: Date | null,
  durationDays: number,
) {
  const periodStart =
    previousEnd && previousEnd > paidAt ? previousEnd : paidAt;
  const periodEnd = new Date(periodStart.getTime());
  periodEnd.setUTCDate(periodEnd.getUTCDate() + durationDays);
  return { periodStart, periodEnd };
}
