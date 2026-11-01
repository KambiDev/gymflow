import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import type { NewStaffFields } from "./validation";

export function listStaff(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, role: "staff" },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function createStaff(
  organizationId: string,
  fields: NewStaffFields,
) {
  const passwordHash = await bcrypt.hash(fields.password, 12);
  return prisma.user.create({
    data: {
      organizationId,
      name: fields.name,
      email: fields.email,
      passwordHash,
      role: "staff",
    },
    select: { id: true },
  });
}

export function setStaffActive(
  organizationId: string,
  id: string,
  active: boolean,
) {
  return prisma.user.updateMany({
    where: { id, organizationId, role: "staff" },
    data: { active },
  });
}
