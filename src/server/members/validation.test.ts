import assert from "node:assert/strict";
import { test } from "node:test";

import { memberSchema, memberStatusSchema } from "./validation";

const valid = {
  firstName: " Ana ",
  lastName: " López ",
  phone: "",
  email: "",
  planId: "",
  notes: "",
};

test("trims member names and converts optional empty fields to null", () => {
  const result = memberSchema.parse(valid);
  assert.equal(result.firstName, "Ana");
  assert.equal(result.lastName, "López");
  assert.equal(result.planId, null);
  assert.equal(result.email, null);
});

test("rejects missing names, malformed email and invalid status", () => {
  assert.equal(
    memberSchema.safeParse({ ...valid, firstName: " " }).success,
    false,
  );
  assert.equal(
    memberSchema.safeParse({ ...valid, email: "bad-email" }).success,
    false,
  );
  assert.equal(memberStatusSchema.safeParse("overdue").success, false);
});
