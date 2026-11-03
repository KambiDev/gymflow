import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import { calculatePaymentPeriod } from "./period";
import type { PaymentFields } from "./validation";

export class PaymentMemberUnavailableError extends Error {}

export function listPaymentsForMember(
  organizationId: string,
  memberId: string,
) {
  return prisma.payment.findMany({
    where: { organizationId, memberId },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
    take: 50,
  });
}

export function findPaymentReceiptForOrg(
  organizationId: string,
  memberId: string,
  paymentId: string,
) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      organizationId,
      memberId,
      member: { organizationId },
    },
    select: {
      id: true,
      amount: true,
      paidAt: true,
      method: true,
      periodStart: true,
      periodEnd: true,
      member: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function recordPaymentForOrg(
  organizationId: string,
  memberId: string,
  fields: PaymentFields,
  paidAt = new Date(),
) {
  // Serializable isolation prevents simultaneous cashiers from extending the same
  // member's period from the same old date. Retry only serialization conflicts.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const member = await tx.member.findFirst({
            where: { id: memberId, organizationId, status: "active" },
            select: {
              id: true,
              nextPaymentDate: true,
              plan: { select: { durationDays: true, organizationId: true } },
            },
          });

          if (!member?.plan || member.plan.organizationId !== organizationId) {
            throw new PaymentMemberUnavailableError(
              "El socio debe estar activo y tener un plan de este gimnasio para registrar un pago.",
            );
          }

          const { periodStart, periodEnd } = calculatePaymentPeriod(
            paidAt,
            member.nextPaymentDate,
            member.plan.durationDays,
          );
          const payment = await tx.payment.create({
            data: {
              organizationId,
              memberId,
              ...fields,
              paidAt,
              periodStart,
              periodEnd,
            },
          });
          await tx.member.update({
            where: { id: memberId, organizationId },
            data: { nextPaymentDate: periodEnd },
          });
          return payment;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      )
        continue;
      throw error;
    }
  }
  throw new Error("No se pudo registrar el pago.");
}
