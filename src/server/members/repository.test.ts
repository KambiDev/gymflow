import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import {
  createMemberForOrg,
  findMember,
  listAvailablePlans,
  listMembers,
  MemberPlanUnavailableError,
  setMemberStatusForOrg,
  updateMemberForOrg,
} from "./repository";

test("isolates member reads, writes and plan assignments across gyms", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Members test A" } }),
    prisma.organization.create({ data: { name: "Members test B" } }),
  ]);

  try {
    const ownPlan = await prisma.plan.create({
      data: {
        organizationId: first.id,
        name: "Mensual",
        price: 800,
        durationDays: 30,
      },
    });
    const otherPlan = await prisma.plan.create({
      data: {
        organizationId: second.id,
        name: "Mensual",
        price: 900,
        durationDays: 30,
      },
    });
    const fields = {
      firstName: "Marta",
      lastName: "Sánchez",
      phone: null,
      email: null,
      notes: null,
      planId: ownPlan.id,
    };

    await assert.rejects(
      createMemberForOrg(first.id, { ...fields, planId: otherPlan.id }),
      MemberPlanUnavailableError,
    );
    const member = await createMemberForOrg(first.id, fields);
    assert.deepEqual((await listAvailablePlans(first.id)).map((plan) => plan.id), [ownPlan.id]);

    assert.equal(
      (await listMembers(first.id, "", 1)).total,
      1,
      "no-search listing",
    );
    assert.equal(
      (await listMembers(first.id, "MAR", 1)).total,
      1,
      "first name search",
    );
    assert.equal(
      (await listMembers(first.id, "sán", 1)).total,
      1,
      "last name search",
    );
    assert.equal(
      (await listMembers(first.id, "MAR sán", 1)).total,
      1,
      "full name search",
    );
    assert.equal((await listMembers(second.id, "marta", 1)).total, 0);
    assert.equal(await findMember(second.id, member.id), null);
    assert.equal(await updateMemberForOrg(second.id, member.id, fields), false);
    assert.equal(
      (await setMemberStatusForOrg(second.id, member.id, "inactive")).count,
      0,
    );

    await assert.rejects(
      updateMemberForOrg(first.id, member.id, {
        ...fields,
        planId: otherPlan.id,
      }),
      MemberPlanUnavailableError,
    );
    await prisma.plan.update({ where: { id: ownPlan.id }, data: { active: false } });
    await assert.rejects(
      createMemberForOrg(first.id, fields),
      MemberPlanUnavailableError,
    );
    assert.deepEqual((await listAvailablePlans(first.id)).map((plan) => plan.id), []);
    assert.deepEqual(
      (await listAvailablePlans(first.id, ownPlan.id)).map((plan) => plan.id),
      [ownPlan.id],
    );
    assert.equal(await updateMemberForOrg(first.id, member.id, fields), true);
    assert.equal(
      (await setMemberStatusForOrg(first.id, member.id, "inactive")).count,
      1,
    );
    assert.equal((await findMember(first.id, member.id))?.status, "inactive");
    assert.equal(
      (await setMemberStatusForOrg(first.id, member.id, "active")).count,
      1,
    );
    assert.equal((await findMember(first.id, member.id))?.status, "active");
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
