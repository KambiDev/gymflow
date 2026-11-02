import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dailyReportPageSize = 20;
export const paymentMethods = ["cash", "transfer", "card", "other"] as const;

/** A YYYY-MM-DD Nicaragua calendar day maps to [06:00 UTC, 06:00 UTC next day). */
export function paymentDayWindow(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [year, month, date] = day.split("-").map(Number);
  if (year < 1000 || year > 9999) return null;
  const start = new Date(Date.UTC(year, month - 1, date, 6));
  if (start.toISOString().slice(0, 10) !== day) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getDailyPaymentReport(
  organizationId: string,
  day: string,
  page: number,
) {
  const window = paymentDayWindow(day);
  if (!window || !Number.isSafeInteger(page) || page < 1)
    throw new Error("Invalid daily payment report input");

  const where = {
    organizationId,
    paidAt: { gte: window.start, lt: window.end },
  };
  const [groups, payments] = await Promise.all([
    prisma.payment.groupBy({
      by: ["method"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        paidAt: true,
        amount: true,
        method: true,
        notes: true,
        member: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ paidAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * dailyReportPageSize,
      take: dailyReportPageSize,
    }),
  ]);

  const total = groups.reduce(
    (sum, group) => sum.plus(group._sum.amount ?? 0),
    new Prisma.Decimal(0),
  );
  const count = groups.reduce((sum, group) => sum + group._count._all, 0);
  const methods: { method: string; count: number; amount: Prisma.Decimal }[] =
    paymentMethods.map((method) => {
      const group = groups.find((item) => item.method === method);
      return {
        method,
        count: group?._count._all ?? 0,
        amount: group?._sum.amount ?? new Prisma.Decimal(0),
      };
    });
  for (const group of groups) {
    if (!paymentMethods.some((method) => method === group.method)) {
      methods.push({
        method: group.method,
        count: group._count._all,
        amount: group._sum.amount ?? new Prisma.Decimal(0),
      });
    }
  }
  return { total, count, methods, payments, pageSize: dailyReportPageSize };
}
