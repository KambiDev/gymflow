import assert from "node:assert/strict";
import { test } from "node:test";

import { createStaffSchema, staffStatusSchema } from "./validation";

test("normalizes staff details and rejects invalid passwords and statuses", () => {
  const valid = {
    name: " Ana López ",
    email: " ANA@EXAMPLE.COM ",
    password: crypto.randomUUID(),
  };
  assert.equal(createStaffSchema.parse(valid).email, "ana@example.com");
  assert.equal(createStaffSchema.parse(valid).name, "Ana López");
  assert.equal(
    createStaffSchema.safeParse({ ...valid, password: "short" }).success,
    false,
  );
  assert.equal(
    createStaffSchema.safeParse({ ...valid, password: "á".repeat(40) }).success,
    false,
  );
  assert.equal(staffStatusSchema.safeParse("suspended").success, false);
});
