import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { deactivatePlanForOrg, listPlans } from "./repository";

test("lists and deactivates plans only within the current gym", async () => {
  const first = await prisma.organization.create({ data: { name: "Isolation A" } });
  const second = await prisma.organization.create({ data: { name: "Isolation B" } });

  try {
    const own = await prisma.plan.create({ data: { name: "Test A", price: 100, durationDays: 30, organizationId: first.id } });
    const other = await prisma.plan.create({ data: { name: "Test B", price: 200, durationDays: 30, organizationId: second.id } });

    assert.deepEqual((await listPlans(first.id)).map((plan) => plan.id), [own.id]);
    assert.deepEqual((await listPlans(second.id)).map((plan) => plan.id), [other.id]);

    assert.equal((await deactivatePlanForOrg(first.id, other.id)).count, 0);
    assert.equal((await prisma.plan.findUniqueOrThrow({ where: { id: other.id } })).active, true);
    assert.equal((await deactivatePlanForOrg(first.id, own.id)).count, 1);
    assert.equal((await prisma.plan.findUniqueOrThrow({ where: { id: own.id } })).active, false);
  } finally {
    await prisma.organization.deleteMany({ where: { id: { in: [first.id, second.id] } } });
    await prisma.$disconnect();
  }
});
