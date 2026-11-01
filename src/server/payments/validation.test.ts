import assert from "node:assert/strict";
import { test } from "node:test";

import { paymentSchema } from "./validation";

test("accepts valid NIO amounts, payment methods and optional notes", () => {
  assert.deepEqual(
    paymentSchema.parse({ amount: " 800.50 ", method: "cash", notes: " " }),
    {
      amount: "800.50",
      method: "cash",
      notes: null,
    },
  );
});

test("rejects zero, excess precision, negative and unsupported methods", () => {
  for (const amount of ["0", "0.00", "1.234", "-5", "999999999", "NaN"]) {
    assert.equal(
      paymentSchema.safeParse({ amount, method: "cash", notes: "" }).success,
      false,
    );
  }
  assert.equal(
    paymentSchema.safeParse({ amount: "30", method: "crypto", notes: "" })
      .success,
    false,
  );
});
