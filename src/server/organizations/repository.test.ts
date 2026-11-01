import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";

import { prisma } from "../../lib/db";
import {
  createOrganization,
  findOrganization,
  setOrganizationPaidUntil,
  setOrganizationStatus,
} from "./repository";

test("provisions an administrator atomically and toggles only the selected gym", async () => {
  const other = await prisma.organization.create({
    data: { name: "Other org test" },
  });
  let createdId: string | undefined;
  try {
    const fields = {
      name: "Provisioning test",
      contactName: "Test Owner",
      contactEmail: `owner-${crypto.randomUUID()}@example.test`,
      contactPhone: null,
      adminPassword: crypto.randomUUID(),
    };
    const created = await createOrganization(fields);
    createdId = created.id;
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: fields.contactEmail },
    });
    assert.equal(admin.organizationId, created.id);
    assert.equal(admin.role, "admin");
    assert.notEqual(admin.passwordHash, fields.adminPassword);
    assert.equal(
      await bcrypt.compare(fields.adminPassword, admin.passwordHash),
      true,
    );

    assert.equal(
      (await setOrganizationStatus(created.id, "suspended")).count,
      1,
    );
    assert.equal((await findOrganization(created.id))?.status, "suspended");
    assert.equal((await findOrganization(other.id))?.status, "active");
    assert.equal((await setOrganizationStatus(created.id, "active")).count, 1);
    assert.equal(
      (await setOrganizationStatus("does-not-exist", "suspended")).count,
      0,
    );
    const paidUntil = new Date("2026-12-01T05:59:59.999Z");
    assert.equal(
      (await setOrganizationPaidUntil(created.id, paidUntil)).count,
      1,
    );
    assert.equal(
      (
        await findOrganization(created.id)
      )?.subscriptionPaidUntil?.toISOString(),
      paidUntil.toISOString(),
    );
    assert.equal((await setOrganizationPaidUntil(created.id, null)).count, 1);
    assert.equal(
      (await findOrganization(created.id))?.subscriptionPaidUntil,
      null,
    );
    assert.equal(
      (await findOrganization(other.id))?.subscriptionPaidUntil,
      null,
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [other.id, ...(createdId ? [createdId] : [])] } },
    });
    await prisma.$disconnect();
  }
});
