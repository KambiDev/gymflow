import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import {
  listPaymentsForMember,
  PaymentMemberUnavailableError,
  recordPaymentForOrg,
} from "./repository";

test("records tenant-scoped payments atomically and extends each paid period", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Payments test A" } }),
    prisma.organization.create({ data: { name: "Payments test B" } }),
  ]);
  try {
    const plan = await prisma.plan.create({
      data: {
        organizationId: first.id,
        name: "Monthly",
        price: 800,
        durationDays: 30,
      },
    });
    const member = await prisma.member.create({
      data: {
        organizationId: first.id,
        firstName: "Ana",
        lastName: "Test",
        planId: plan.id,
      },
    });
    const fields = {
      amount: "800.50",
      method: "transfer" as const,
      notes: null,
    };
    const firstDate = new Date("2026-11-01T12:00:00.000Z");

    await assert.rejects(
      recordPaymentForOrg(second.id, member.id, fields, firstDate),
      PaymentMemberUnavailableError,
    );
    assert.equal((await listPaymentsForMember(second.id, member.id)).length, 0);
    assert.equal(
      (await prisma.member.findUniqueOrThrow({ where: { id: member.id } }))
        .nextPaymentDate,
      null,
    );

    const initial = await recordPaymentForOrg(
      first.id,
      member.id,
      fields,
      firstDate,
    );
    assert.equal(initial.amount.toString(), "800.5");
    assert.equal(initial.periodEnd.toISOString(), "2026-12-01T12:00:00.000Z");
    await prisma.plan.update({
      where: { id: plan.id },
      data: { active: false },
    });
    const renewal = await recordPaymentForOrg(
      first.id,
      member.id,
      fields,
      new Date("2026-11-15T12:00:00.000Z"),
    );
    assert.equal(
      renewal.periodStart.toISOString(),
      initial.periodEnd.toISOString(),
    );
    assert.equal(renewal.periodEnd.toISOString(), "2026-12-31T12:00:00.000Z");
    assert.equal(
      (
        await prisma.member.findUniqueOrThrow({ where: { id: member.id } })
      ).nextPaymentDate?.toISOString(),
      renewal.periodEnd.toISOString(),
    );
    assert.equal((await listPaymentsForMember(first.id, member.id)).length, 2);

    await prisma.member.update({
      where: { id: member.id },
      data: { status: "inactive" },
    });
    await assert.rejects(
      recordPaymentForOrg(first.id, member.id, fields),
      PaymentMemberUnavailableError,
    );
    await prisma.member.update({
      where: { id: member.id },
      data: { status: "active", planId: null },
    });
    await assert.rejects(
      recordPaymentForOrg(first.id, member.id, fields),
      PaymentMemberUnavailableError,
    );
    assert.equal((await listPaymentsForMember(first.id, member.id)).length, 2);
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});

test("simultaneous payments do not reuse the same due date", async () => {
  const organization = await prisma.organization.create({
    data: { name: "Payments parallel test" },
  });
  try {
    const plan = await prisma.plan.create({
      data: {
        organizationId: organization.id,
        name: "Weekly",
        price: 100,
        durationDays: 7,
      },
    });
    const member = await prisma.member.create({
      data: {
        organizationId: organization.id,
        firstName: "Concurrent",
        lastName: "Test",
        planId: plan.id,
      },
    });
    const date = new Date("2026-11-01T12:00:00.000Z");
    await Promise.all([
      recordPaymentForOrg(
        organization.id,
        member.id,
        { amount: "100", method: "cash", notes: null },
        date,
      ),
      recordPaymentForOrg(
        organization.id,
        member.id,
        { amount: "100", method: "cash", notes: null },
        date,
      ),
    ]);
    const payments = await listPaymentsForMember(organization.id, member.id);
    assert.equal(payments.length, 2);
    assert.deepEqual(
      payments.map((payment) => payment.periodEnd.toISOString()).sort(),
      ["2026-11-08T12:00:00.000Z", "2026-11-15T12:00:00.000Z"],
    );
    assert.equal(
      (
        await prisma.member.findUniqueOrThrow({ where: { id: member.id } })
      ).nextPaymentDate?.toISOString(),
      "2026-11-15T12:00:00.000Z",
    );
  } finally {
    await prisma.organization.deleteMany({ where: { id: organization.id } });
    await prisma.$disconnect();
  }
});
