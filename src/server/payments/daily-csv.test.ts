import "dotenv/config";

import assert from "node:assert/strict";
import { test } from "node:test";

import { prisma } from "../../lib/db";
import { csvText } from "../csv";
import { dailyPaymentCsv } from "./daily-csv";

async function collectCsv(organizationId: string, day: string) {
  let csv = "";
  for await (const chunk of dailyPaymentCsv(organizationId, day)) csv += chunk;
  return csv;
}

test("CSV escapes quoted data and neutralizes spreadsheet formulas", () => {
  assert.equal(csvText('Ana,"B"'), '"Ana,""B"""');
  for (const value of ["=1+1", "+cmd", "-2+3", "@SUM(1)", " \t=1+1"]) {
    assert.equal(csvText(value), `"'${value}"`);
  }
  assert.equal(csvText("texto\r\nnuevo"), '"texto\r\nnuevo"');
});

test("CSV exports every page for only the authenticated gym and Nicaragua day", async () => {
  const [first, second] = await prisma.$transaction([
    prisma.organization.create({ data: { name: "CSV test A" } }),
    prisma.organization.create({ data: { name: "CSV test B" } }),
  ]);
  try {
    const [memberA, memberB] = await prisma.$transaction([
      prisma.member.create({
        data: {
          organizationId: first.id,
          firstName: "=SUM(1,1)",
          lastName: 'Peña "A"',
        },
      }),
      prisma.member.create({
        data: {
          organizationId: second.id,
          firstName: "Other",
          lastName: "Gym",
        },
      }),
    ]);
    const payment = (
      organizationId: string,
      memberId: string,
      paidAt: string,
      notes: string | null = null,
    ) => ({
      organizationId,
      memberId,
      paidAt: new Date(paidAt),
      amount: "0.10",
      method: "cash",
      notes,
      periodStart: new Date(paidAt),
      periodEnd: new Date("2026-12-01T06:00:00.000Z"),
    });
    await prisma.payment.createMany({
      data: [
        payment(first.id, memberA.id, "2026-11-01T05:59:59.999Z"),
        ...Array.from({ length: 201 }, () =>
          payment(first.id, memberA.id, "2026-11-01T12:00:00.000Z"),
        ),
        payment(
          first.id,
          memberA.id,
          "2026-11-02T05:59:59.999Z",
          '\t=HYPERLINK("x")\r\nnueva línea',
        ),
        payment(first.id, memberA.id, "2026-11-02T06:00:00.000Z"),
        payment(second.id, memberB.id, "2026-11-01T12:00:00.000Z"),
      ],
    });

    const csv = await collectCsv(first.id, "2026-11-01");
    assert.ok(
      csv.startsWith(
        "\uFEFFFecha Nicaragua,Hora Nicaragua,ID cobro,Socio,Método,Monto NIO,Notas\r\n",
      ),
    );
    assert.equal(csv.match(/,0\.10,/g)?.length, 202);
    assert.ok(csv.includes('"01/11/2026","23:59:59"'));
    assert.ok(csv.includes('"\'=SUM(1,1) Peña ""A"""'));
    assert.ok(csv.includes('"\'\t=HYPERLINK(""x"")\r\nnueva línea"'));
    assert.ok(csv.includes(",0.10,"));
    assert.ok(!csv.includes("Other Gym"));
    const nextDay = await collectCsv(first.id, "2026-11-02");
    assert.equal(nextDay.split("\r\n").length - 1, 2);
    assert.equal(
      (await collectCsv(second.id, "2026-11-01")).split("\r\n").length - 1,
      2,
    );
    assert.equal(
      (await collectCsv(first.id, "2026-10-30")).split("\r\n").length - 1,
      1,
    );
    await assert.rejects(collectCsv(first.id, "2026-02-29"));
  } finally {
    await prisma.organization.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
});
