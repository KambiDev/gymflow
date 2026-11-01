import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import type { NewOrganizationFields } from "./validation";

export function listOrganizations(page: number) {
  const pageSize = 20;
  return Promise.all([
    prisma.organization.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { members: true } } },
    }),
    prisma.organization.count(),
  ]).then(([organizations, total]) => ({ organizations, total, pageSize }));
}

export function findOrganization(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        where: { role: "admin" },
        select: { email: true, name: true },
        take: 1,
      },
      _count: { select: { members: true, plans: true } },
    },
  });
}

export async function createOrganization(fields: NewOrganizationFields) {
  const passwordHash = await bcrypt.hash(fields.adminPassword, 12);
  return prisma.organization.create({
    data: {
      name: fields.name,
      contactName: fields.contactName,
      contactEmail: fields.contactEmail,
      contactPhone: fields.contactPhone,
      users: {
        create: {
          email: fields.contactEmail,
          name: fields.contactName,
          passwordHash,
          role: "admin",
        },
      },
    },
  });
}

export function setOrganizationStatus(
  id: string,
  status: "active" | "suspended",
) {
  return prisma.organization.updateMany({ where: { id }, data: { status } });
}

export function setOrganizationPaidUntil(id: string, paidUntil: Date | null) {
  return prisma.organization.updateMany({
    where: { id },
    data: { subscriptionPaidUntil: paidUntil },
  });
}
