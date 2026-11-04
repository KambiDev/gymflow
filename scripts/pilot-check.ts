import "dotenv/config";

import { prisma } from "../src/lib/db";
import {
  checkPilotDatabase,
  pilotEnvironmentIssues,
} from "../src/server/operations/readiness";

async function main() {
  const issues = pilotEnvironmentIssues(process.env);
  if (issues.length) {
    for (const issue of issues) console.error(`✗ ${issue}`);
    process.exitCode = 1;
    return;
  }

  try {
    await checkPilotDatabase();
    console.log("✓ Variables esenciales y tablas principales disponibles.");
    console.log(
      "Siguiente paso: npx prisma migrate status (no incluido en esta comprobación).",
    );
  } catch {
    console.error(
      "✗ No se pudo consultar PostgreSQL o faltan tablas. Revisa la conexión y las migraciones.",
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
