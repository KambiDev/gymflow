import assert from "node:assert/strict";
import { test } from "node:test";

import { paymentDayWindow } from "./dates";

test("Nicaragua day window rejects invalid dates and includes exactly one local day", () => {
  assert.deepEqual(
    Object.values(paymentDayWindow("2026-11-01") ?? {}).map((value) =>
      value.toISOString(),
    ),
    ["2026-11-01T06:00:00.000Z", "2026-11-02T06:00:00.000Z"],
  );
  assert.equal(paymentDayWindow("2026-02-29"), null);
  assert.equal(
    paymentDayWindow("2024-02-29")?.start.toISOString(),
    "2024-02-29T06:00:00.000Z",
  );
  assert.equal(paymentDayWindow("2026-13-01"), null);
  assert.equal(paymentDayWindow("2026-11-1"), null);
  assert.equal(paymentDayWindow("2026-11-01T06:00Z"), null);
});
