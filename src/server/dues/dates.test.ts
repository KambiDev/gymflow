import assert from "node:assert/strict";
import { test } from "node:test";

import { dueDateWindow } from "./dates";

test("Nicaragua day changes at 06:00 UTC, not midnight UTC", () => {
  assert.equal(
    dueDateWindow(new Date("2026-11-02T05:59:59Z")).today.toISOString(),
    "2026-11-01T06:00:00.000Z",
  );
  assert.equal(
    dueDateWindow(new Date("2026-11-02T06:00:00Z")).today.toISOString(),
    "2026-11-02T06:00:00.000Z",
  );
});

test("seven-day window includes today through day six", () => {
  assert.equal(
    dueDateWindow(
      new Date("2026-12-29T19:00:00Z"),
    ).afterSevenDays.toISOString(),
    "2027-01-05T06:00:00.000Z",
  );
});
