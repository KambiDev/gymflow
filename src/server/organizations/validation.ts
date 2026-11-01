import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

/** Inclusive local date; stored at the last millisecond of that Nicaragua day. */
export function paidUntilEndOfDay(value: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Fecha inválida.");
  const [year, month, day] = value.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (utcDate.toISOString().slice(0, 10) !== value)
    throw new Error("Fecha inválida.");
  // Managua is UTC−06:00 in the current operating period.
  return new Date(utcDate.getTime() + 30 * 60 * 60 * 1000 - 1);
}

export function paidUntilInputValue(date: Date | null): string {
  return date
    ? new Date(date.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : "";
}

export function platformBillingStatus(
  paidUntil: Date | null,
  now = new Date(),
) {
  return paidUntil === null
    ? "unrecorded"
    : paidUntil < now
      ? "overdue"
      : "current";
}

export const paidUntilSchema = z
  .string()
  .refine((value) => {
    try {
      paidUntilEndOfDay(value);
      return true;
    } catch {
      return false;
    }
  }, "Ingresa una fecha válida.")
  .transform(paidUntilEndOfDay);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del gimnasio.").max(100),
  contactName: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del administrador.")
    .max(100),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Ingresa un correo válido.")),
  contactPhone: optionalText(30),
  adminPassword: z
    .string()
    .min(12, "Usa al menos 12 caracteres para la contraseña.")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "La contraseña es demasiado larga.",
    ),
});

export const organizationStatusSchema = z.enum(["active", "suspended"]);

export type NewOrganizationFields = z.infer<typeof createOrganizationSchema>;
