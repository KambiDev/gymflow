import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import {
  maxImportRows,
  MemberImportError,
  type MemberImportRow,
} from "./import-csv";

/** Shared read-only checks; import repeats them inside its write transaction. */
async function validateImportForOrg(
  db: Pick<Prisma.TransactionClient, "plan" | "member">,
  organizationId: string,
  rows: MemberImportRow[],
) {
  if (rows.length < 1 || rows.length > maxImportRows)
    throw new Error("Invalid member import size");
  const names = [
    ...new Set(rows.flatMap(({ planName }) => (planName ? [planName] : []))),
  ];
  const plans = names.length
    ? await db.plan.findMany({
        where: { organizationId, active: true, name: { in: names } },
        select: { id: true, name: true },
      })
    : [];
  const planIds = new Map(plans.map(({ name, id }) => [name, id]));
  for (const { planName, line } of rows) {
    if (planName && !planIds.has(planName))
      throw new MemberImportError(
        `Fila ${line}: el plan «${planName}» no está activo o no pertenece a este gimnasio.`,
      );
  }
  const emails = rows.flatMap(({ member }) =>
    member.email ? [member.email] : [],
  );
  const existing = emails.length
    ? await db.member.findFirst({
        where: { organizationId, email: { in: emails, mode: "insensitive" } },
        select: { id: true },
      })
    : null;
  return { duplicateEmail: Boolean(existing), planIds };
}

/** Read-only preflight; the import always repeats these checks before writing. */
export async function previewMembersForOrg(
  organizationId: string,
  rows: MemberImportRow[],
) {
  const { duplicateEmail } = await validateImportForOrg(
    prisma,
    organizationId,
    rows,
  );
  return {
    duplicateEmail,
    members: rows.length,
    withPlan: rows.filter(({ planName }) => planName !== null).length,
  };
}

/** All-or-nothing import; resolve only active plans in this organization. */
export function importMembersForOrg(
  organizationId: string,
  rows: MemberImportRow[],
) {
  if (rows.length < 1 || rows.length > maxImportRows)
    throw new Error("Invalid member import size");
  return prisma.$transaction(
    async (tx) => {
      const { duplicateEmail, planIds } = await validateImportForOrg(
        tx,
        organizationId,
        rows,
      );
      if (duplicateEmail) return { imported: 0, duplicateEmail: true };
      const created = await tx.member.createMany({
        data: rows.map(({ member, planName }) => ({
          organizationId,
          ...member,
          planId: planName ? planIds.get(planName)! : null,
        })),
      });
      return { imported: created.count, duplicateEmail: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
