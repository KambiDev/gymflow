import "dotenv/config";

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import bcrypt from "bcryptjs";

import { prisma } from "../../lib/db";
import { bootstrapPlatformOwner, insertInitialOwner } from "./bootstrap-owner";

test("first-owner insert never assigns a gym or stores plaintext; existing owners are untouched", async () => {
  const fields = {
    email: "pilot@example.test",
    name: "Dueño inicial",
    passwordHash: "bcrypt-hash",
  };
  let created: unknown;
  const tx = {
    user: {
      findFirst: async () => null,
      create: async (data: unknown) => {
        created = data;
      },
    },
  } as unknown as Parameters<typeof insertInitialOwner>[0];
  assert.equal(await insertInitialOwner(tx, fields), true);
  assert.deepEqual(created, {
    data: { ...fields, role: "platform_owner", organizationId: null },
  });
  const existingTx = {
    user: {
      findFirst: async () => ({ id: "existing" }),
      create: async () => {
        throw new Error("Must not overwrite existing owner");
      },
    },
  } as unknown as Parameters<typeof insertInitialOwner>[0];
  assert.equal(await insertInitialOwner(existingTx, fields), false);
});

test("validates bootstrap input without echoing credentials", async () => {
  const password = randomBytes(18).toString("hex");
  await assert.rejects(
    bootstrapPlatformOwner({ name: "Dueño", email: "invalid", password }),
    (error: unknown) =>
      error instanceof Error && !error.message.includes(password),
  );
  await assert.rejects(
    bootstrapPlatformOwner({
      name: "Dueño",
      email: "owner@example.test",
      password: "x".repeat(73),
    }),
  );
});

test("creates only the first owner, hashes its password and creates no demo gym", async () => {
  const existing = await prisma.user.findFirst({
    where: { role: "platform_owner" },
  });
  if (existing) {
    // Shared dev databases can already have a seed owner; never remove it.
    assert.equal(
      await bootstrapPlatformOwner({
        email: `new-${randomBytes(8).toString("hex")}@example.test`,
        name: "Nuevo dueño",
        password: randomBytes(18).toString("hex"),
      }),
      false,
    );
    await prisma.$disconnect();
    return;
  }
  const email = `pilot-${randomBytes(8).toString("hex")}@example.test`;
  const password = randomBytes(18).toString("hex");
  try {
    const before = await prisma.organization.count();
    assert.equal(
      await bootstrapPlatformOwner({
        email: ` ${email.toUpperCase()} `,
        name: " Dueño inicial ",
        password,
      }),
      true,
    );
    const owner = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.equal(owner.role, "platform_owner");
    assert.equal(owner.organizationId, null);
    assert.equal(owner.name, "Dueño inicial");
    assert.notEqual(owner.passwordHash, password);
    assert.ok(await bcrypt.compare(password, owner.passwordHash));
    assert.equal(await prisma.organization.count(), before);
    assert.equal(
      await bootstrapPlatformOwner({
        email: `other-${email}`,
        name: "Otro dueño",
        password,
      }),
      false,
    );
  } finally {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
