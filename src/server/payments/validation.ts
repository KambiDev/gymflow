import { z } from "zod";

export const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(
      /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/,
      "Ingresa un monto válido en córdobas (máximo 2 decimales).",
    )
    .refine(
      (amount) => Number(amount) > 0,
      "El monto debe ser mayor que cero.",
    ),
  method: z.enum(
    ["cash", "transfer", "card", "other"],
    "Selecciona un método válido.",
  ),
  notes: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden superar 1000 caracteres.")
    .transform((notes) => notes || null),
});

export type PaymentFields = z.infer<typeof paymentSchema>;
