import { z } from "zod";

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null);

export const memberSchema = z.object({
  firstName: z.string().trim().min(2, "Escribe el nombre del socio.").max(80),
  lastName: z.string().trim().min(2, "Escribe el apellido del socio.").max(80),
  phone: optionalText(30),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Ingresa un correo válido.",
    )
    .transform((value) => value || null),
  planId: optionalText(100),
  notes: optionalText(1000),
});

export type MemberFields = z.infer<typeof memberSchema>;

export const memberStatusSchema = z.enum(["active", "inactive"]);
