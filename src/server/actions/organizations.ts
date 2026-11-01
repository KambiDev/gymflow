"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformOwner } from "@/lib/session";
import {
  createOrganization,
  setOrganizationPaidUntil,
  setOrganizationStatus,
} from "@/server/organizations/repository";
import {
  createOrganizationSchema,
  organizationStatusSchema,
  paidUntilSchema,
} from "@/server/organizations/validation";

export type OrganizationFormState = { error?: string; success?: boolean };

export async function registerOrganization(
  _state: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  await requirePlatformOwner();
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    adminPassword: formData.get("adminPassword"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  let organization;
  try {
    organization = await createOrganization(parsed.data);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "Ese correo ya pertenece a un usuario de la plataforma.",
      };
    }
    throw error;
  }

  revalidatePath("/admin");
  redirect(`/admin/${organization.id}`);
}

export async function changeOrganizationStatus(formData: FormData) {
  await requirePlatformOwner();
  const id = formData.get("id");
  const status = organizationStatusSchema.safeParse(formData.get("status"));
  if (typeof id !== "string" || !id || id.length > 100 || !status.success)
    return;

  await setOrganizationStatus(id, status.data);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function updateOrganizationPaidUntil(
  id: string,
  _state: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  await requirePlatformOwner();
  if (!id || id.length > 100) return { error: "Gimnasio no encontrado." };
  const parsed = paidUntilSchema.safeParse(formData.get("paidUntil"));
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Fecha inválida." };

  const result = await setOrganizationPaidUntil(id, parsed.data);
  if (result.count === 0) return { error: "Gimnasio no encontrado." };
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  return { success: true };
}
