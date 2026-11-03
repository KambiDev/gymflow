import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { findPaymentReceiptForOrg } from "./repository";

test("receipts require the exact gym, member and payment and survive member deactivation", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Receipt gym A" } }),
    prisma.organization.create({ data: { name: "Receipt gym B" } }),
  ]);
  try {
    const [memberA, anotherMemberA, memberB] = await prisma.$transaction([
      prisma.member.create({
        data: { organizationId: first.id, firstName: "Ana", lastName: "Test" },
      }),
      prisma.member.create({
        data: {
          organizationId: first.id,
          firstName: "Another",
          lastName: "Test",
        },
      }),
      prisma.member.create({
        data: {
          organizationId: second.id,
          firstName: "Beto",
          lastName: "Test",
        },
      }),
    ]);
    const paidAt = new Date("2026-11-01T06:00:00.000Z");
    const payment = (organizationId: string, memberId: string) => ({
      organizationId,
      memberId,
      paidAt,
      amount: "20.10",
      method: "card",
      periodStart: paidAt,
      periodEnd: new Date("2026-12-01T06:00:00.000Z"),
    });
    const [paymentA, paymentB] = await prisma.$transaction([
      prisma.payment.create({ data: payment(first.id, memberA.id) }),
      prisma.payment.create({ data: payment(second.id, memberB.id) }),
    ]);
    await prisma.member.update({
      where: { id: memberA.id },
      data: { status: "inactive" },
    });

    const receipt = await findPaymentReceiptForOrg(
      first.id,
      memberA.id,
      paymentA.id,
    );
    assert.equal(receipt?.amount.toFixed(2), "20.10");
    assert.equal(receipt?.member.firstName, "Ana");
    assert.equal(receipt?.paidAt.toISOString(), "2026-11-01T06:00:00.000Z");
    assert.equal(
      await findPaymentReceiptForOrg(second.id, memberA.id, paymentA.id),
      null,
    );
    assert.equal(
      await findPaymentReceiptForOrg(first.id, anotherMemberA.id, paymentA.id),
      null,
    );
    assert.equal(
      await findPaymentReceiptForOrg(first.id, memberB.id, paymentB.id),
      null,
    );
    assert.equal(
      await findPaymentReceiptForOrg(first.id, memberA.id, "missing"),
      null,
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
