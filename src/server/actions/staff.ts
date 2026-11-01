"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { requireOrgAdmin } from "@/lib/session";
import { createStaff, setStaffActive } from "@/server/staff/repository";
import {
  createStaffSchema,
  staffStatusSchema,
} from "@/server/staff/validation";

export type StaffFormState = { error?: string; success?: boolean };

export async function registerStaff(
  _state: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const session = await requireOrgAdmin();
  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  try {
    await createStaff(session.user.organizationId, parsed.data);
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
  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function changeStaffStatus(formData: FormData) {
  const session = await requireOrgAdmin();
  const id = formData.get("id");
  const status = staffStatusSchema.safeParse(formData.get("status"));
  if (typeof id !== "string" || !id || id.length > 100 || !status.success)
    return;
  await setStaffActive(
    session.user.organizationId,
    id,
    status.data === "active",
  );
  revalidatePath("/dashboard/staff");
}
