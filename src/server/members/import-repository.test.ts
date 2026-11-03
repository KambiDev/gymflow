import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { MemberImportError, parseMemberImportCsv } from "./import-csv";
import { importMembersForOrg } from "./repository";

test("imports atomically into one gym without plans, payments or cross-gym duplicate checks", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Import test A" } }),
    prisma.organization.create({ data: { name: "Import test B" } }),
  ]);
  try {
    const csv =
      "Nombre,Apellido,Teléfono,Correo\nAna,López,,ana@example.test\nBeto,Ruiz,,";
    const members = parseMemberImportCsv(csv);
    await prisma.member.create({
      data: {
        organizationId: second.id,
        firstName: "Otra",
        lastName: "Persona",
        email: "ana@example.test",
      },
    });
    assert.deepEqual(await importMembersForOrg(first.id, members), {
      imported: 2,
      duplicateEmail: false,
    });
    const imported = await prisma.member.findMany({
      where: { organizationId: first.id },
      orderBy: { firstName: "asc" },
    });
    assert.equal(imported.length, 2);
    assert.ok(
      imported.every(
        (member) =>
          member.planId === null &&
          member.nextPaymentDate === null &&
          member.status === "active",
      ),
    );
    assert.equal(
      await prisma.payment.count({ where: { organizationId: first.id } }),
      0,
    );
    assert.deepEqual(await importMembersForOrg(first.id, members), {
      imported: 0,
      duplicateEmail: true,
    });
    assert.equal(
      await prisma.member.count({ where: { organizationId: first.id } }),
      2,
    );
    const collision = parseMemberImportCsv(
      "Nombre,Apellido,Teléfono,Correo\nClara,Pérez,,new@example.test\nOtra,Persona,,ANA@EXAMPLE.TEST",
    );
    assert.deepEqual(await importMembersForOrg(first.id, collision), {
      imported: 0,
      duplicateEmail: true,
    });
    assert.equal(
      await prisma.member.count({ where: { organizationId: first.id } }),
      2,
    );
    assert.equal(
      await prisma.member.count({ where: { organizationId: second.id } }),
      1,
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});

test("resolves plans only within the gym, rejects unavailable plans atomically and leaves dues unpaid", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Import plan test A" } }),
    prisma.organization.create({ data: { name: "Import plan test B" } }),
  ]);
  try {
    const own = await prisma.plan.create({
      data: {
        organizationId: first.id,
        name: "Mensual",
        price: 800,
        durationDays: 30,
      },
    });
    await prisma.plan.create({
      data: {
        organizationId: first.id,
        name: "Inactivo",
        price: 800,
        durationDays: 30,
        active: false,
      },
    });
    await prisma.plan.create({
      data: {
        organizationId: second.id,
        name: "Exclusivo",
        price: 800,
        durationDays: 30,
      },
    });
    const csv = (plan: string) =>
      parseMemberImportCsv(
        `Nombre,Apellido,Teléfono,Correo,Plan\nAna,López,,ana@example.test,Mensual\nBeto,Ruiz,,,${plan}`,
      );
    for (const invalid of ["Inactivo", "Exclusivo", "No existe", "mensual"]) {
      await assert.rejects(
        importMembersForOrg(first.id, csv(invalid)),
        (error: unknown) => {
          assert.ok(error instanceof MemberImportError);
          assert.match(error.message, /Fila 3/);
          return true;
        },
      );
      assert.equal(
        await prisma.member.count({ where: { organizationId: first.id } }),
        0,
      );
    }
    assert.deepEqual(await importMembersForOrg(first.id, csv("")), {
      imported: 2,
      duplicateEmail: false,
    });
    const imported = await prisma.member.findMany({
      where: { organizationId: first.id },
      orderBy: { firstName: "asc" },
    });
    assert.equal(imported[0].planId, own.id);
    assert.equal(imported[1].planId, null);
    assert.ok(
      imported.every(
        ({ status, nextPaymentDate }) =>
          status === "active" && nextPaymentDate === null,
      ),
    );
    assert.equal(
      await prisma.payment.count({ where: { organizationId: first.id } }),
      0,
    );
    assert.equal(
      await prisma.member.count({ where: { organizationId: second.id } }),
      0,
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
