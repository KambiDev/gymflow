import { prisma } from "@/lib/db";

type PilotEnvironment = {
  DATABASE_URL?: string;
  DATABASE_URL_UNPOOLED?: string;
  AUTH_SECRET?: string;
  AUTH_URL?: string;
  NODE_ENV?: string;
};

/** Do not include environment values in errors: these may contain credentials. */
export function pilotEnvironmentIssues(env: PilotEnvironment): string[] {
  const issues: string[] = [];
  if (!env.AUTH_SECRET || Buffer.byteLength(env.AUTH_SECRET, "utf8") < 32)
    issues.push(
      "AUTH_SECRET debe tener al menos 32 bytes; genera uno con npx auth secret.",
    );

  try {
    const url = new URL(env.DATABASE_URL ?? "");
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
  } catch {
    issues.push("DATABASE_URL debe ser una URL de PostgreSQL válida.");
  }

  if (env.DATABASE_URL_UNPOOLED) {
    try {
      const url = new URL(env.DATABASE_URL_UNPOOLED);
      if (!["postgres:", "postgresql:"].includes(url.protocol))
        throw new Error();
    } catch {
      issues.push(
        "DATABASE_URL_UNPOOLED debe ser una URL de PostgreSQL válida.",
      );
    }
  }

  if (env.NODE_ENV === "production" && !env.AUTH_URL)
    issues.push(
      "En producción configura AUTH_URL con la dirección HTTPS pública.",
    );
  if (env.AUTH_URL) {
    try {
      const url = new URL(env.AUTH_URL);
      if (
        url.protocol !== "https:" ||
        !url.hostname ||
        (env.NODE_ENV === "production" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      )
        throw new Error();
    } catch {
      issues.push("AUTH_URL debe ser una URL HTTPS pública válida.");
    }
  }
  return issues;
}

/** Read-only schema and connectivity smoke test; not a migration-status check. */
export async function checkPilotDatabase() {
  await Promise.all([
    prisma.organization.findFirst({ select: { id: true } }),
    prisma.user.findFirst({ select: { id: true } }),
    prisma.plan.findFirst({ select: { id: true } }),
    prisma.member.findFirst({ select: { id: true } }),
    prisma.payment.findFirst({ select: { id: true } }),
  ]);
}
