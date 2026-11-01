import { prisma } from "@/lib/db";

export function listPlans(organizationId: string) {
  return prisma.plan.findMany({
    where: { organizationId },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
}

export function deactivatePlanForOrg(organizationId: string, id: string) {
  return prisma.plan.updateMany({
    where: { id, organizationId, active: true },
    data: { active: false },
  });
}
