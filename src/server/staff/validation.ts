import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del colaborador.").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Ingresa un correo válido.")),
  password: z
    .string()
    .min(12, "Usa al menos 12 caracteres para la contraseña.")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "La contraseña es demasiado larga.",
    ),
});

export const staffStatusSchema = z.enum(["active", "inactive"]);
export type NewStaffFields = z.infer<typeof createStaffSchema>;
