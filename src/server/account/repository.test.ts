import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";

import { prisma } from "../../lib/db";
import { hasCurrentSessionVersion } from "../../lib/account-access";
import { changeAccountPassword } from "./repository";

test("changes only the authenticated account and invalidates earlier session versions", async () => {
  const organization = await prisma.organization.create({
    data: { name: "Password test" },
  });
  const otherOrganization = await prisma.organization.create({
    data: { name: "Other password test" },
  });
  try {
    const oldPassword = crypto.randomUUID();
    const newPassword = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        name: "Password user",
        email: `password-${crypto.randomUUID()}@example.test`,
        organizationId: organization.id,
        role: "staff",
        passwordHash: await bcrypt.hash(oldPassword, 10),
      },
    });
    assert.equal(
      await changeAccountPassword(
        user.id,
        otherOrganization.id,
        0,
        oldPassword,
        newPassword,
      ),
      "expired",
    );
    assert.equal(
      await changeAccountPassword(
        user.id,
        organization.id,
        0,
        "wrong",
        newPassword,
      ),
      "incorrect",
    );
    assert.equal(
      await changeAccountPassword(
        user.id,
        organization.id,
        0,
        oldPassword,
        oldPassword,
      ),
      "unchanged",
    );
    assert.equal(
      await changeAccountPassword(
        user.id,
        organization.id,
        0,
        oldPassword,
        newPassword,
      ),
      "changed",
    );
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    assert.notEqual(updated.passwordHash, newPassword);
    assert.equal(await bcrypt.compare(newPassword, updated.passwordHash), true);
    assert.equal(
      await bcrypt.compare(oldPassword, updated.passwordHash),
      false,
    );
    assert.equal(updated.sessionVersion, 1);
    assert.equal(hasCurrentSessionVersion(updated.sessionVersion, 0), false);
    assert.equal(hasCurrentSessionVersion(updated.sessionVersion, 1), true);
    assert.equal(
      await changeAccountPassword(
        user.id,
        organization.id,
        0,
        newPassword,
        crypto.randomUUID(),
      ),
      "expired",
    );
    assert.equal(
      await changeAccountPassword(
        user.id,
        organization.id,
        1,
        oldPassword,
        crypto.randomUUID(),
      ),
      "incorrect",
    );
    await prisma.user.update({
      where: { id: user.id },
      data: { active: false },
    });
    assert.equal(
      await changeAccountPassword(
        user.id,
        organization.id,
        1,
        newPassword,
        crypto.randomUUID(),
      ),
      "expired",
    );

    const ownerPassword = crypto.randomUUID();
    const owner = await prisma.user.create({
      data: {
        name: "Platform owner",
        role: "platform_owner",
        email: `owner-${crypto.randomUUID()}@example.test`,
        passwordHash: await bcrypt.hash(ownerPassword, 10),
      },
    });
    try {
      assert.equal(
        await changeAccountPassword(
          owner.id,
          null,
          0,
          ownerPassword,
          crypto.randomUUID(),
        ),
        "changed",
      );
      assert.equal(
        (await prisma.user.findUniqueOrThrow({ where: { id: owner.id } }))
          .sessionVersion,
        1,
      );
    } finally {
      await prisma.user.delete({ where: { id: owner.id } });
    }
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [organization.id, otherOrganization.id] } },
    });
    await prisma.$disconnect();
  }
});
