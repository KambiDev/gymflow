import assert from "node:assert/strict";
import { test } from "node:test";

import { calculatePaymentPeriod } from "./period";

test("starts a first or overdue payment on the payment date", () => {
  const paidAt = new Date("2026-11-01T23:30:00.000Z");
  for (const previousEnd of [null, new Date("2026-10-31T23:30:00.000Z")]) {
    const period = calculatePaymentPeriod(paidAt, previousEnd, 30);
    assert.equal(period.periodStart.toISOString(), paidAt.toISOString());
    assert.equal(period.periodEnd.toISOString(), "2026-12-01T23:30:00.000Z");
  }
});

test("extends an unexpired period without losing days across leap years", () => {
  const period = calculatePaymentPeriod(
    new Date("2024-02-01T10:00:00.000Z"),
    new Date("2024-02-28T10:00:00.000Z"),
    2,
  );
  assert.equal(period.periodStart.toISOString(), "2024-02-28T10:00:00.000Z");
  assert.equal(period.periodEnd.toISOString(), "2024-03-01T10:00:00.000Z");
});
