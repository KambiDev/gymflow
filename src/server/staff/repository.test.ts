import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";

import { prisma } from "../../lib/db";
import {
  canAccessOrganization,
  canManageStaff,
  canSignIn,
} from "../../lib/account-access";
import { createStaff, listStaff, setStaffActive } from "./repository";

test("creates hashed staff accounts and isolates listing and status changes by gym and role", async () => {
  assert.equal(canManageStaff("staff"), false);
  assert.equal(canManageStaff("platform_owner"), false);
  assert.equal(canManageStaff("admin"), true);
  const first = await prisma.organization.create({
    data: { name: "Staff isolation A" },
  });
  const second = await prisma.organization.create({
    data: { name: "Staff isolation B" },
  });
  try {
    const password = crypto.randomUUID();
    const own = await createStaff(first.id, {
      name: "Test Staff",
      email: `staff-${crypto.randomUUID()}@example.test`,
      password,
    });
    const other = await createStaff(second.id, {
      name: "Other Staff",
      email: `staff-${crypto.randomUUID()}@example.test`,
      password,
    });
    const admin = await prisma.user.create({
      data: {
        organizationId: first.id,
        role: "admin",
        name: "Test Admin",
        email: `admin-${crypto.randomUUID()}@example.test`,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    assert.deepEqual(
      (await listStaff(first.id)).map((user) => user.id),
      [own.id],
    );
    assert.deepEqual(
      (await listStaff(second.id)).map((user) => user.id),
      [other.id],
    );
    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: own.id },
      include: { organization: true },
    });
    assert.notEqual(saved.passwordHash, password);
    assert.equal(await bcrypt.compare(password, saved.passwordHash), true);
    const session = { role: "staff", organizationId: first.id };
    assert.equal(canAccessOrganization(saved, session), true);
    assert.equal(canSignIn(saved), true);

    assert.equal((await setStaffActive(first.id, other.id, false)).count, 0);
    assert.equal((await setStaffActive(first.id, admin.id, false)).count, 0);
    assert.equal((await setStaffActive(first.id, own.id, false)).count, 1);
    const disabled = await prisma.user.findUniqueOrThrow({
      where: { id: own.id },
      include: { organization: true },
    });
    assert.equal(canAccessOrganization(disabled, session), false);
    assert.equal(canSignIn(disabled), false);
    assert.equal(
      canAccessOrganization(saved, { role: "admin", organizationId: first.id }),
      false,
    );
    assert.equal(
      canAccessOrganization(saved, {
        role: "staff",
        organizationId: second.id,
      }),
      false,
    );
    assert.equal(canAccessOrganization(null, session), false);
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: other.id } })).active,
      true,
    );
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).active,
      true,
    );
    assert.equal((await setStaffActive(first.id, own.id, true)).count, 1);
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: own.id } })).active,
      true,
    );
    await prisma.organization.update({
      where: { id: first.id },
      data: { status: "suspended" },
    });
    const suspended = await prisma.user.findUniqueOrThrow({
      where: { id: own.id },
      include: { organization: true },
    });
    assert.equal(canAccessOrganization(suspended, session), false);
    assert.equal(canSignIn(suspended), false);
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
