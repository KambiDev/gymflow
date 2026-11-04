import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { paymentDayWindow } from "./dates";

export const dailyReportPageSize = 20;
export const paymentMethods = ["cash", "transfer", "card", "other"] as const;

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
