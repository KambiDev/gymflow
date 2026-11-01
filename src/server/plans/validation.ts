import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(80),
  price: z
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, "Ingresa un precio válido en córdobas (hasta 2 decimales).")
    .refine((value) => Number(value) > 0, "El precio debe ser mayor que cero."),
  durationDays: z.coerce.number<number>().int().min(1, "Mínimo 1 día.").max(3650, "Máximo 3650 días."),
});
