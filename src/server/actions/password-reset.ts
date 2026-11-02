"use server";

import { requireOrgAdmin, requirePlatformOwner } from "@/lib/session";
import { resetManagedPassword } from "@/server/account/repository";
import { resetPasswordSchema } from "@/server/account/validation";

export type PasswordResetState = { error?: string; success?: boolean };

function parseResetInput(id: string, formData: FormData) {
  if (!id || id.length > 100)
    return { error: "Usuario no encontrado." } as const;
  const parsed = resetPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa la contraseña.",
    } as const;
  return { password: parsed.data.newPassword } as const;
}

export async function resetStaffPassword(
  id: string,
  _state: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const session = await requireOrgAdmin();
  const input = parseResetInput(id, formData);
  if ("error" in input) return { error: input.error };
  const updated = await resetManagedPassword(
    session.user.organizationId,
    id,
    "staff",
    input.password,
  );
  return updated.count === 1
    ? { success: true }
    : { error: "Usuario no encontrado." };
}

export async function resetGymAdminPassword(
  organizationId: string,
  id: string,
  _state: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  await requirePlatformOwner();
  if (!organizationId || organizationId.length > 100)
    return { error: "Gimnasio no encontrado." };
  const input = parseResetInput(id, formData);
  if ("error" in input) return { error: input.error };
  const updated = await resetManagedPassword(
    organizationId,
    id,
    "admin",
    input.password,
  );
  return updated.count === 1
    ? { success: true }
    : { error: "Usuario no encontrado." };
}
