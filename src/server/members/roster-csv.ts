import { prisma } from "@/lib/db";
import { csvText } from "@/server/csv";

const batchSize = 200;
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Managua",
});

/** Full roster, including inactive members; no payment history or private notes. */
export async function* memberRosterCsv(organizationId: string) {
  yield "\uFEFFID socio,Nombre,Apellido,Teléfono,Correo,Estado,Plan,Próximo pago Nicaragua,Alta Nicaragua\r\n";
  let cursor: string | undefined;
  while (true) {
    const members = await prisma.member.findMany({
      where: { organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
        plan: { select: { name: true } },
        nextPaymentDate: true,
        startedAt: true,
      },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (members.length === 0) break;
    yield members
      .map(
        (member) =>
          [
            csvText(member.id),
            csvText(member.firstName),
            csvText(member.lastName),
            csvText(member.phone ?? ""),
            csvText(member.email ?? ""),
            csvText(member.status === "active" ? "Activo" : "Inactivo"),
            csvText(member.plan?.name ?? ""),
            csvText(
              member.nextPaymentDate
                ? dateFormat.format(member.nextPaymentDate)
                : "",
            ),
            csvText(dateFormat.format(member.startedAt)),
          ].join(",") + "\r\n",
      )
      .join("");
    cursor = members.at(-1)!.id;
    if (members.length < batchSize) break;
  }
}
