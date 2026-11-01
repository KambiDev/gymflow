import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import { dueDateWindow } from "./dates";

export type DueCategory = "overdue" | "upcoming" | "unpaid";

function categoryWhere(
  organizationId: string,
  category: DueCategory,
  now: Date,
): Prisma.MemberWhereInput {
  const { today, afterSevenDays } = dueDateWindow(now);
  return {
    organizationId,
    status: "active",
    nextPaymentDate:
      category === "overdue"
        ? { lt: today }
        : category === "upcoming"
          ? { gte: today, lt: afterSevenDays }
          : null,
  };
}

export async function getDuesSummary(organizationId: string, now = new Date()) {
  const [active, overdue, upcoming, unpaid, overdueMembers, upcomingMembers] =
    await Promise.all([
      prisma.member.count({ where: { organizationId, status: "active" } }),
      prisma.member.count({
        where: categoryWhere(organizationId, "overdue", now),
      }),
      prisma.member.count({
        where: categoryWhere(organizationId, "upcoming", now),
      }),
      prisma.member.count({
        where: categoryWhere(organizationId, "unpaid", now),
      }),
      prisma.member.findMany({
        where: categoryWhere(organizationId, "overdue", now),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nextPaymentDate: true,
        },
        orderBy: [{ nextPaymentDate: "asc" }, { id: "asc" }],
        take: 5,
      }),
      prisma.member.findMany({
        where: categoryWhere(organizationId, "upcoming", now),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nextPaymentDate: true,
        },
        orderBy: [{ nextPaymentDate: "asc" }, { id: "asc" }],
        take: 5,
      }),
    ]);
  return { active, overdue, upcoming, unpaid, overdueMembers, upcomingMembers };
}

export async function listDues(
  organizationId: string,
  category: DueCategory,
  page: number,
  now = new Date(),
) {
  const where = categoryWhere(organizationId, category, now);
  const pageSize = 20;
  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        nextPaymentDate: true,
        plan: { select: { name: true } },
      },
      orderBy:
        category === "unpaid"
          ? [{ createdAt: "asc" }, { id: "asc" }]
          : [{ nextPaymentDate: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.member.count({ where }),
  ]);
  return { members, total, pageSize };
}
