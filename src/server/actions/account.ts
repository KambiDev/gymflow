"use server";

import { signOut } from "@/lib/auth";
import {
  requireOrgSession,
  requirePlatformOwner,
  requireSession,
} from "@/lib/session";
import { changeAccountPassword } from "@/server/account/repository";
import { changePasswordSchema } from "@/server/account/validation";

export type PasswordFormState = { error?: string };

export async function changePassword(
  _state: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const signedIn = await requireSession();
  const session =
    signedIn.user.role === "platform_owner"
      ? await requirePlatformOwner()
      : await requireOrgSession();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa las contraseñas.",
    };

  const outcome = await changeAccountPassword(
    session.user.id,
    session.user.organizationId,
    session.user.sessionVersion,
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  if (outcome === "incorrect")
    return { error: "La contraseña actual no es correcta." };
  if (outcome === "unchanged")
    return { error: "La contraseña nueva debe ser distinta de la actual." };
  if (outcome === "expired")
    return { error: "La sesión cambió. Inicia sesión de nuevo." };

  await signOut({ redirectTo: "/login" });
  return {};
}
