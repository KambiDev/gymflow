"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireOrgSession } from "@/lib/session";
import { deactivatePlanForOrg } from "@/server/plans/repository";
import { createPlanSchema } from "@/server/plans/validation";

export type PlanFormState = { error?: string; success?: boolean };

export async function createPlan(
  _state: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const session = await requireOrgSession();
  const parsed = createPlanSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationDays: formData.get("durationDays"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  try {
    await prisma.plan.create({
      data: { ...parsed.data, organizationId: session.user.organizationId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Ya existe un plan con ese nombre en tu gimnasio." };
    }
    throw error;
  }

  revalidatePath("/dashboard/plans");
  return { success: true };
}

export async function deactivatePlan(formData: FormData) {
  const session = await requireOrgSession();
  const id = formData.get("id");

  if (typeof id !== "string" || !id || id.length > 100) {
    return;
  }

  await deactivatePlanForOrg(session.user.organizationId, id);

  revalidatePath("/dashboard/plans");
}
