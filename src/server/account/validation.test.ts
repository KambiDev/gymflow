import assert from "node:assert/strict";
import { test } from "node:test";

import { changePasswordSchema } from "./validation";

test("validates current password, new password length, byte limit and confirmation", () => {
  const valid = {
    currentPassword: "old",
    newPassword: crypto.randomUUID(),
    confirmPassword: "",
  };
  valid.confirmPassword = valid.newPassword;
  assert.equal(changePasswordSchema.safeParse(valid).success, true);
  assert.equal(
    changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success,
    false,
  );
  assert.equal(
    changePasswordSchema.safeParse({ ...valid, newPassword: "short" }).success,
    false,
  );
  assert.equal(
    changePasswordSchema.safeParse({ ...valid, newPassword: "á".repeat(40) })
      .success,
    false,
  );
  assert.equal(
    changePasswordSchema.safeParse({ ...valid, confirmPassword: "wrong" })
      .success,
    false,
  );
});
