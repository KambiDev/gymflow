import bcrypt from "bcryptjs";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const bootstrapSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  name: z.string().trim().min(2).max(80),
  password: z
    .string()
    .min(12)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});

/** One-time creation only; never replaces an existing platform owner's credentials. */
export async function insertInitialOwner(
  tx: Pick<Prisma.TransactionClient, "user">,
  fields: { email: string; name: string; passwordHash: string },
) {
  const existing = await tx.user.findFirst({
    where: { role: "platform_owner" },
    select: { id: true },
  });
  if (existing) return false;
  await tx.user.create({
    data: { ...fields, role: "platform_owner", organizationId: null },
  });
  return true;
}

export async function bootstrapPlatformOwner(input: unknown) {
  const parsed = bootstrapSchema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Datos de inicio inválidos: revisa el correo, nombre y contraseña (12–72 bytes).",
    );
  const { email, name, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.$transaction(
    (tx) => insertInitialOwner(tx, { email, name, passwordHash }),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
