import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import type { MemberFields } from "./validation";

const PAGE_SIZE = 20;

export class MemberPlanUnavailableError extends Error {}

export async function listMembers(
  organizationId: string,
  query: string,
  page: number,
) {
  const terms = query.trim().slice(0, 80).split(/\s+/).filter(Boolean);
  const where: Prisma.MemberWhereInput = {
    organizationId,
    AND: terms.map((term) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { phone: { contains: term } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    })),
  };

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: { plan: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.member.count({ where }),
  ]);

  return { members, total, pageSize: PAGE_SIZE };
}

export function findMember(organizationId: string, id: string) {
  return prisma.member.findFirst({ where: { organizationId, id } });
}

export function listAvailablePlans(
  organizationId: string,
  currentPlanId?: string | null,
) {
  return prisma.plan.findMany({
    where: {
      organizationId,
      OR: [{ active: true }, ...(currentPlanId ? [{ id: currentPlanId }] : [])],
    },
    select: { id: true, name: true, active: true },
    orderBy: { name: "asc" },
  });
}

async function checkPlan(
  organizationId: string,
  planId: string | null,
  currentPlanId?: string | null,
) {
  if (!planId) return;

  const plan = await prisma.plan.findFirst({
    where: { id: planId, organizationId },
    select: { active: true },
  });

  if (!plan || (!plan.active && planId !== currentPlanId)) {
    throw new MemberPlanUnavailableError(
      "El plan seleccionado ya no está disponible.",
    );
  }
}

export async function createMemberForOrg(
  organizationId: string,
  fields: MemberFields,
) {
  await checkPlan(organizationId, fields.planId);
  return prisma.member.create({ data: { organizationId, ...fields } });
}

/** All-or-nothing import; an existing email in this gym aborts the whole batch. */
export function importMembersForOrg(
  organizationId: string,
  members: MemberFields[],
) {
  if (members.length < 1 || members.length > 200)
    throw new Error("Invalid member import size");
  return prisma.$transaction(
    async (tx) => {
      const emails = members.flatMap((member) =>
        member.email ? [member.email] : [],
      );
      if (emails.length) {
        const existing = await tx.member.findFirst({
          where: { organizationId, email: { in: emails, mode: "insensitive" } },
          select: { id: true },
        });
        if (existing) return { imported: 0, duplicateEmail: true };
      }
      const created = await tx.member.createMany({
        data: members.map((member) => ({ organizationId, ...member })),
      });
      return { imported: created.count, duplicateEmail: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function updateMemberForOrg(
  organizationId: string,
  id: string,
  fields: MemberFields,
) {
  const member = await findMember(organizationId, id);
  if (!member) return false;

  await checkPlan(organizationId, fields.planId, member.planId);
  const result = await prisma.member.updateMany({
    where: { organizationId, id },
    data: fields,
  });
  return result.count === 1;
}

export function setMemberStatusForOrg(
  organizationId: string,
  id: string,
  status: "active" | "inactive",
) {
  return prisma.member.updateMany({
    where: { organizationId, id },
    data: { status },
  });
}
