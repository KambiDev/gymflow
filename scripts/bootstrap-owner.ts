import "dotenv/config";

import { prisma } from "../src/lib/db";
import { bootstrapPlatformOwner } from "../src/server/operations/bootstrap-owner";

async function main() {
  try {
    const created = await bootstrapPlatformOwner({
      email: process.env.BOOTSTRAP_OWNER_EMAIL,
      name: process.env.BOOTSTRAP_OWNER_NAME,
      password: process.env.BOOTSTRAP_OWNER_PASSWORD,
    });
    if (created)
      console.log(
        "✓ Cuenta inicial de plataforma creada. Cambia su contraseña al ingresar.",
      );
    else
      console.log(
        "ℹ Ya existe un dueño de plataforma; no se modificó ninguna cuenta.",
      );
  } catch {
    console.error(
      "✗ No se pudo crear la cuenta inicial. Revisa los datos, la conexión y que el correo esté libre; no se muestran credenciales.",
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
