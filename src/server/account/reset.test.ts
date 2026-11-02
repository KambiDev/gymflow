import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";

import { prisma } from "../../lib/db";
import { hasCurrentSessionVersion } from "../../lib/account-access";
import { findManagedAccount, resetManagedPassword } from "./repository";

test("resets only matching gym and role, revokes sessions and preserves account status", async () => {
  const first = await prisma.organization.create({
    data: { name: "Reset gym A" },
  });
  const second = await prisma.organization.create({
    data: { name: "Reset gym B" },
  });
  const oldPassword = crypto.randomUUID();
  const newPassword = crypto.randomUUID();
  let ownerId: string | undefined;
  const createUser = (organizationId: string | null, role: string) =>
    prisma.user.create({
      data: {
        name: "Reset test",
        role,
        organizationId,
        email: `reset-${crypto.randomUUID()}@example.test`,
        passwordHash: bcrypt.hashSync(oldPassword, 10),
      },
    });

  try {
    const staffA = await createUser(first.id, "staff");
    const staffB = await createUser(second.id, "staff");
    const adminA = await createUser(first.id, "admin");
    const owner = await createUser(null, "platform_owner");
    ownerId = owner.id;
    assert.equal(await findManagedAccount(first.id, staffB.id, "staff"), null);
    assert.equal(await findManagedAccount(first.id, adminA.id, "staff"), null);
    assert.equal(await findManagedAccount(first.id, owner.id, "admin"), null);
    assert.equal(
      (await resetManagedPassword(first.id, staffB.id, "staff", newPassword))
        .count,
      0,
    );
    assert.equal(
      (await resetManagedPassword(first.id, adminA.id, "staff", newPassword))
        .count,
      0,
    );
    assert.equal(
      (await resetManagedPassword(first.id, owner.id, "admin", newPassword))
        .count,
      0,
    );

    await prisma.user.update({
      where: { id: staffA.id },
      data: { active: false },
    });
    assert.equal(
      (await resetManagedPassword(first.id, staffA.id, "staff", newPassword))
        .count,
      1,
    );
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: staffA.id },
    });
    assert.equal(updated.active, false);
    assert.equal(updated.sessionVersion, 1);
    assert.equal(hasCurrentSessionVersion(updated.sessionVersion, 0), false);
    assert.notEqual(updated.passwordHash, newPassword);
    assert.equal(await bcrypt.compare(newPassword, updated.passwordHash), true);
    assert.equal(
      await bcrypt.compare(oldPassword, updated.passwordHash),
      false,
    );
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: staffB.id } }))
        .sessionVersion,
      0,
    );

    assert.equal(
      (await resetManagedPassword(first.id, adminA.id, "admin", newPassword))
        .count,
      1,
    );
    const adminUpdated = await prisma.user.findUniqueOrThrow({
      where: { id: adminA.id },
    });
    assert.equal(adminUpdated.sessionVersion, 1);
    assert.equal(
      await bcrypt.compare(newPassword, adminUpdated.passwordHash),
      true,
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    if (ownerId) await prisma.user.delete({ where: { id: ownerId } });
    await prisma.$disconnect();
  }
});
