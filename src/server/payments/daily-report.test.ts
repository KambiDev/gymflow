import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { getDailyPaymentReport } from "./daily-report";

test("daily report rejects invalid dates and pages before querying", async () => {
  await assert.rejects(getDailyPaymentReport("any", "2026-02-29", 1));
  await assert.rejects(getDailyPaymentReport("any", "2026-11-01", 0));
});

test("daily report totals, pagination and rows stay within the gym and local day", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Daily report A" } }),
    prisma.organization.create({ data: { name: "Daily report B" } }),
  ]);
  try {
    const [memberA, memberB] = await prisma.$transaction([
      prisma.member.create({
        data: { organizationId: first.id, firstName: "Ana", lastName: "Test" },
      }),
      prisma.member.create({
        data: {
          organizationId: second.id,
          firstName: "Beto",
          lastName: "Test",
        },
      }),
    ]);
    const payment = (
      organizationId: string,
      memberId: string,
      paidAt: string,
      amount: string,
      method: string,
    ) => ({
      organizationId,
      memberId,
      paidAt: new Date(paidAt),
      amount,
      method,
      periodStart: new Date(paidAt),
      periodEnd: new Date("2026-12-01T06:00:00.000Z"),
    });
    await prisma.payment.createMany({
      data: [
        payment(
          first.id,
          memberA.id,
          "2026-11-01T05:59:59.999Z",
          "900.00",
          "cash",
        ),
        payment(
          first.id,
          memberA.id,
          "2026-11-01T06:00:00.000Z",
          "0.10",
          "cash",
        ),
        payment(
          first.id,
          memberA.id,
          "2026-11-01T12:00:00.000Z",
          "0.20",
          "cash",
        ),
        ...Array.from({ length: 19 }, () =>
          payment(
            first.id,
            memberA.id,
            "2026-11-01T18:00:00.000Z",
            "1.01",
            "transfer",
          ),
        ),
        payment(
          first.id,
          memberA.id,
          "2026-11-02T05:59:59.999Z",
          "2.00",
          "card",
        ),
        payment(
          first.id,
          memberA.id,
          "2026-11-02T06:00:00.000Z",
          "300.00",
          "cash",
        ),
        payment(
          second.id,
          memberB.id,
          "2026-11-01T18:00:00.000Z",
          "500.00",
          "other",
        ),
      ],
    });
    await prisma.member.update({
      where: { id: memberA.id },
      data: { status: "inactive" },
    });

    const firstPage = await getDailyPaymentReport(first.id, "2026-11-01", 1);
    const secondPage = await getDailyPaymentReport(first.id, "2026-11-01", 2);
    assert.equal(firstPage.count, 22);
    assert.equal(firstPage.total.toFixed(2), "21.49");
    assert.deepEqual(
      firstPage.methods.map((group) => [
        group.method,
        group.count,
        group.amount.toFixed(2),
      ]),
      [
        ["cash", 2, "0.30"],
        ["transfer", 19, "19.19"],
        ["card", 1, "2.00"],
        ["other", 0, "0.00"],
      ],
    );
    assert.equal(firstPage.payments.length, 20);
    assert.equal(secondPage.payments.length, 2);
    assert.equal(
      new Set(
        [...firstPage.payments, ...secondPage.payments].map((row) => row.id),
      ).size,
      22,
    );
    assert.ok(
      [...firstPage.payments, ...secondPage.payments].every(
        (row) => row.member.id === memberA.id,
      ),
    );
    assert.equal(
      (await getDailyPaymentReport(second.id, "2026-11-01", 1)).total.toFixed(
        2,
      ),
      "500.00",
    );
    assert.equal(
      (await getDailyPaymentReport(first.id, "2026-11-02", 1)).total.toFixed(2),
      "300.00",
    );
    assert.equal(
      (await getDailyPaymentReport(first.id, "2026-10-30", 1)).count,
      0,
    );
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
