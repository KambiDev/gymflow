import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const ownerEmail = "owner@gymflow.app";
  const demoAdminEmail = "admin@gymdemo.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "GymFlow2026!";
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "GymDemo2026!";

  const organization = await prisma.organization.upsert({
    where: { id: "org_demo" },
    update: {},
    create: {
      id: "org_demo",
      name: "Gym Demo",
      contactName: "María López",
      contactPhone: "+505 8888 8888",
      contactEmail: demoAdminEmail,
    },
  });

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Dueño de GymFlow",
      role: "platform_owner",
      passwordHash: await bcrypt.hash(ownerPassword, 10),
    },
  });

  await prisma.user.upsert({
    where: { email: demoAdminEmail },
    update: {},
    create: {
      email: demoAdminEmail,
      name: "María López",
      role: "admin",
      organizationId: organization.id,
      passwordHash: await bcrypt.hash(demoPassword, 10),
    },
  });

  const plans = [
    { name: "Mensual", price: 800, durationDays: 30 },
    { name: "Trimestral", price: 2000, durationDays: 90 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: plan.name,
        },
      },
      update: {
        price: plan.price,
        durationDays: plan.durationDays,
      },
      create: {
        organizationId: organization.id,
        ...plan,
      },
    });
  }

  console.log("Seed completado:");
  console.log(`  Platform owner: ${ownerEmail} / ${ownerPassword}`);
  console.log(`  Admin del gym:  ${demoAdminEmail} / ${demoPassword}`);
  console.log("  Cambia estas contraseñas antes de producción.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
