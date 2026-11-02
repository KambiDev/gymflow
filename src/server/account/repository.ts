import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";

export async function changeAccountPassword(
  id: string,
  organizationId: string | null,
  sessionVersion: number,
  currentPassword: string,
  newPassword: string,
): Promise<"changed" | "incorrect" | "unchanged" | "expired"> {
  const user = await prisma.user.findFirst({
    where: { id, organizationId, active: true, sessionVersion },
    select: { passwordHash: true },
  });
  if (!user) return "expired";
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    return "incorrect";
  if (await bcrypt.compare(newPassword, user.passwordHash)) return "unchanged";

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await prisma.user.updateMany({
    where: {
      id,
      organizationId,
      active: true,
      sessionVersion,
      passwordHash: user.passwordHash,
    },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
  return result.count === 1 ? "changed" : "expired";
}

export function findManagedAccount(
  organizationId: string,
  id: string,
  role: "staff" | "admin",
) {
  return prisma.user.findFirst({
    where: { id, organizationId, role },
    select: { id: true, name: true, email: true, active: true },
  });
}

export async function resetManagedPassword(
  organizationId: string,
  id: string,
  role: "staff" | "admin",
  password: string,
) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.updateMany({
    where: { id, organizationId, role },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
}
