import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { getDuesSummary, listDues } from "./repository";

test("counts Nicaragua-day dues for active members only within the gym", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Dues A" } }),
    prisma.organization.create({ data: { name: "Dues B" } }),
  ]);
  const now = new Date("2026-11-02T12:00:00Z");
  try {
    const members = [
      {
        firstName: "Overdue",
        nextPaymentDate: new Date("2026-11-02T05:59:59Z"),
      },
      { firstName: "Today", nextPaymentDate: new Date("2026-11-02T06:00:00Z") },
      {
        firstName: "LastDay",
        nextPaymentDate: new Date("2026-11-09T05:59:59Z"),
      },
      {
        firstName: "Outside",
        nextPaymentDate: new Date("2026-11-09T06:00:00Z"),
      },
      { firstName: "NoPayments", nextPaymentDate: null },
      {
        firstName: "Inactive",
        nextPaymentDate: new Date("2026-10-01T06:00:00Z"),
        status: "inactive",
      },
    ];
    await prisma.member.createMany({
      data: members.map((member) => ({
        organizationId: first.id,
        lastName: "Test",
        ...member,
      })),
    });
    await prisma.member.create({
      data: {
        organizationId: second.id,
        firstName: "OtherGym",
        lastName: "Test",
        nextPaymentDate: new Date("2026-10-01T06:00:00Z"),
      },
    });

    const summary = await getDuesSummary(first.id, now);
    assert.deepEqual(
      [summary.active, summary.overdue, summary.upcoming, summary.unpaid],
      [5, 1, 2, 1],
    );
    assert.deepEqual(
      summary.overdueMembers.map((member) => member.firstName),
      ["Overdue"],
    );
    assert.deepEqual(
      (await listDues(first.id, "upcoming", 1, now)).members.map(
        (member) => member.firstName,
      ),
      ["Today", "LastDay"],
    );
    assert.equal((await listDues(first.id, "unpaid", 1, now)).total, 1);
    assert.equal((await getDuesSummary(second.id, now)).overdue, 1);
    assert.equal(
      (await listDues(second.id, "overdue", 1, now)).members[0]?.firstName,
      "OtherGym",
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
