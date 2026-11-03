import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { csvDownload } from "../csv";
import { memberRosterCsv } from "./roster-csv";

async function collectRoster(organizationId: string) {
  let csv = "";
  for await (const chunk of memberRosterCsv(organizationId)) csv += chunk;
  return csv;
}

test("CSV response uses private, non-cacheable attachment headers", async () => {
  const response = csvDownload(
    memberRosterCsv("no-members"),
    "socios-2026-11-03.csv",
  );
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Content-Type"), "text/csv; charset=utf-8");
  assert.equal(
    response.headers.get("Content-Disposition"),
    'attachment; filename="socios-2026-11-03.csv"',
  );
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.ok((await response.text()).startsWith("ID socio,"));
});

test("member roster exports every page, no other gyms and no private notes", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "Roster A" } }),
    prisma.organization.create({ data: { name: "Roster B" } }),
  ]);
  try {
    const plan = await prisma.plan.create({
      data: {
        organizationId: first.id,
        name: 'Plan,"A"',
        price: "100.00",
        durationDays: 30,
      },
    });
    await prisma.member.createMany({
      data: [
        ...Array.from({ length: 204 }, (_, index) => ({
          organizationId: first.id,
          firstName: `Nombre ${index}`,
          lastName: "Pérez",
          planId: plan.id,
          startedAt: new Date("2026-11-01T12:00:00.000Z"),
        })),
        {
          organizationId: first.id,
          firstName: "=1+1",
          lastName: 'López,"Test"',
          phone: "+505 1234",
          email: "test@example.test",
          notes: "nota-privada-no-exportar",
          status: "inactive",
          nextPaymentDate: new Date("2026-11-02T05:59:59.999Z"),
          startedAt: new Date("2026-11-01T05:59:59.999Z"),
        },
        {
          organizationId: second.id,
          firstName: "SocioOtroGimnasio",
          lastName: "Test",
        },
      ],
    });

    const csv = await collectRoster(first.id);
    assert.ok(
      csv.startsWith(
        "\uFEFFID socio,Nombre,Apellido,Teléfono,Correo,Estado,Plan,Próximo pago Nicaragua,Alta Nicaragua\r\n",
      ),
    );
    assert.equal(csv.split("\r\n").length - 1, 206);
    assert.ok(csv.includes('"\'=1+1","López,""Test""","\'+505 1234"'));
    assert.ok(csv.includes('"Inactivo","","01/11/2026","31/10/2026"'));
    assert.ok(csv.includes('"Plan,""A"""'));
    assert.ok(csv.includes('"Nombre 203"'));
    assert.ok(!csv.includes("SocioOtroGimnasio"));
    assert.ok(!csv.includes("nota-privada-no-exportar"));
    assert.equal((await collectRoster(second.id)).split("\r\n").length - 1, 2);
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
