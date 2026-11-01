import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createOrganizationSchema,
  organizationStatusSchema,
  paidUntilInputValue,
  platformBillingStatus,
  paidUntilSchema,
} from "./validation";

test("normalizes contact email and rejects weak or overly long passwords", () => {
  const valid = {
    name: " Gimnasio Norte ",
    contactName: " Juan Pérez ",
    contactEmail: " JUAN@EXAMPLE.COM ",
    contactPhone: "",
    adminPassword: "safe-password-2026",
  };
  const parsed = createOrganizationSchema.parse(valid);
  assert.equal(parsed.name, "Gimnasio Norte");
  assert.equal(parsed.contactEmail, "juan@example.com");
  assert.equal(parsed.contactPhone, null);
  assert.equal(
    createOrganizationSchema.safeParse({ ...valid, adminPassword: "short" })
      .success,
    false,
  );
  assert.equal(
    createOrganizationSchema.safeParse({
      ...valid,
      adminPassword: "á".repeat(40),
    }).success,
    false,
  );
  assert.equal(organizationStatusSchema.safeParse("inactive").success, false);
});

test("paid-through date includes its whole Nicaragua day and validates leap days", () => {
  assert.equal(
    paidUntilSchema.parse("2028-02-29")?.toISOString(),
    "2028-03-01T05:59:59.999Z",
  );
  assert.equal(
    paidUntilInputValue(paidUntilSchema.parse("2028-02-29")),
    "2028-02-29",
  );
  assert.equal(paidUntilSchema.parse(""), null);
  for (const value of ["2027-02-29", "2026-13-01", "2026-11-31", "tomorrow"]) {
    assert.equal(paidUntilSchema.safeParse(value).success, false);
  }
  const lastDay = paidUntilSchema.parse("2026-11-30");
  assert.equal(
    platformBillingStatus(lastDay, new Date("2026-12-01T05:59:59.999Z")),
    "current",
  );
  assert.equal(
    platformBillingStatus(lastDay, new Date("2026-12-01T06:00:00Z")),
    "overdue",
  );
  assert.equal(platformBillingStatus(null), "unrecorded");
});
