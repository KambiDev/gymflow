import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { listPaymentsForMember } from "./repository";

test("member history pages beyond the first 20 without mixing gyms or members", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "History gym A" } }),
    prisma.organization.create({ data: { name: "History gym B" } }),
  ]);
  try {
    const [member, otherMember, foreignMember] = await prisma.$transaction([
      prisma.member.create({
        data: { organizationId: first.id, firstName: "A", lastName: "History" },
      }),
      prisma.member.create({
        data: {
          organizationId: first.id,
          firstName: "Other",
          lastName: "History",
        },
      }),
      prisma.member.create({
        data: {
          organizationId: second.id,
          firstName: "Foreign",
          lastName: "History",
        },
      }),
    ]);
    const date = new Date("2026-11-01T12:00:00.000Z");
    const payment = (organizationId: string, memberId: string) => ({
      organizationId,
      memberId,
      paidAt: date,
      periodStart: date,
      periodEnd: new Date("2026-12-01T12:00:00.000Z"),
      amount: "1.01",
      method: "cash",
    });
    await prisma.payment.createMany({
      data: [
        ...Array.from({ length: 45 }, () => payment(first.id, member.id)),
        payment(first.id, otherMember.id),
        payment(second.id, foreignMember.id),
      ],
    });
    await prisma.member.update({
      where: { id: member.id },
      data: { status: "inactive" },
    });

    const results = await Promise.all(
      [1, 2, 3, 4].map((page) =>
        listPaymentsForMember(first.id, member.id, page),
      ),
    );
    assert.deepEqual(
      results.map((result) => [
        result.total,
        result.pageSize,
        result.payments.length,
      ]),
      [
        [45, 20, 20],
        [45, 20, 20],
        [45, 20, 5],
        [45, 20, 0],
      ],
    );
    assert.equal(
      new Set(results.flatMap((result) => result.payments.map((row) => row.id)))
        .size,
      45,
    );
    assert.ok(
      results
        .flatMap((result) => result.payments)
        .every((row) => row.memberId === member.id),
    );
    assert.equal(
      (await listPaymentsForMember(second.id, member.id, 1)).total,
      0,
    );
    assert.equal(
      (await listPaymentsForMember(first.id, foreignMember.id, 1)).total,
      0,
    );
    assert.equal(
      (await listPaymentsForMember(first.id, otherMember.id, 1)).total,
      1,
    );
    await assert.rejects(listPaymentsForMember(first.id, member.id, 0));
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
