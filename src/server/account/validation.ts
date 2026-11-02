import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
    newPassword: z
      .string()
      .min(12, "Usa al menos 12 caracteres para la nueva contraseña.")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "La contraseña es demasiado larga.",
      ),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas nuevas no coinciden.",
  });

export type PasswordChangeFields = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, "Usa al menos 12 caracteres para la nueva contraseña.")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "La contraseña es demasiado larga.",
      ),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas nuevas no coinciden.",
  });
