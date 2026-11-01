import assert from "node:assert/strict";
import { test } from "node:test";

import { createPlanSchema } from "./validation";

test("accepts valid plans in córdobas", () => {
  const result = createPlanSchema.parse({ name: " Mensual ", price: "800.50", durationDays: "30" });
  assert.deepEqual(result, { name: "Mensual", price: "800.50", durationDays: 30 });
});

test("rejects invalid prices, days and names", () => {
  for (const [name, price, durationDays] of [
    ["Mensual", "0", "30"],
    ["Mensual", "-2", "30"],
    ["Mensual", "3.999", "30"],
    ["Mensual", "999999999", "30"],
    ["M", "30", "30"],
    ["Mensual", "10", "0"],
    ["Mensual", "10", "2.5"],
  ]) {
    assert.equal(createPlanSchema.safeParse({ name, price, durationDays }).success, false);
  }
});
