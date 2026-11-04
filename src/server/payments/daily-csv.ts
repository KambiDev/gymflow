import { prisma } from "@/lib/db";
import { csvText } from "@/server/csv";
import { paymentDayWindow } from "./dates";

const batchSize = 200;
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Managua",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Managua",
});
const methodNames: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

/** Each chunk is small; the endpoint never holds the entire day's export in memory. */
export async function* dailyPaymentCsv(organizationId: string, day: string) {
  const window = paymentDayWindow(day);
  if (!window) throw new Error("Invalid daily payment report date");

  yield "\uFEFFFecha Nicaragua,Hora Nicaragua,ID cobro,Socio,Método,Monto NIO,Notas\r\n";
  let cursor: string | undefined;
  while (true) {
    const payments = await prisma.payment.findMany({
      where: {
        organizationId,
        paidAt: { gte: window.start, lt: window.end },
      },
      select: {
        id: true,
        paidAt: true,
        amount: true,
        method: true,
        notes: true,
        member: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ paidAt: "desc" }, { id: "desc" }],
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (payments.length === 0) break;
    yield payments
      .map(
        (payment) =>
          [
            csvText(dateFormat.format(payment.paidAt)),
            csvText(timeFormat.format(payment.paidAt)),
            csvText(payment.id),
            csvText(`${payment.member.firstName} ${payment.member.lastName}`),
            csvText(methodNames[payment.method] ?? payment.method),
            payment.amount.toFixed(2),
            csvText(payment.notes ?? ""),
          ].join(",") + "\r\n",
      )
      .join("");
    cursor = payments.at(-1)!.id;
    if (payments.length < batchSize) break;
  }
}
