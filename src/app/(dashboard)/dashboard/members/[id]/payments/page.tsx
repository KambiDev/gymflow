import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOrgSession } from "@/lib/session";
import { recordPayment } from "@/server/actions/payments";
import { listPaymentsForMember } from "@/server/payments/repository";
import { prisma } from "@/lib/db";

import { PaymentForm } from "./payment-form";

export const instant = false;
export const metadata: Metadata = { title: "Cobros del socio" };

const currency = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
});
const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
  timeZone: "America/Managua",
});
const methodNames: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

export default async function MemberPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const organizationId = session.user.organizationId;
  const [member, payments] = await Promise.all([
    prisma.member.findFirst({
      where: { organizationId, id },
      include: {
        plan: {
          select: {
            name: true,
            price: true,
            durationDays: true,
            organizationId: true,
          },
        },
      },
    }),
    listPaymentsForMember(organizationId, id),
  ]);
  if (!member) notFound();

  const canPay =
    member.status === "active" &&
    member.plan?.organizationId === organizationId;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href="/dashboard/members"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver a socios
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cobros de {member.firstName} {member.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {member.plan
            ? `${member.plan.name} · ${member.plan.durationDays} días`
            : "Sin plan"}{" "}
          · Próximo vencimiento:{" "}
          {member.nextPaymentDate
            ? dateFormat.format(member.nextPaymentDate)
            : "sin pagos"}
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Registrar cobro</CardTitle>
          <CardDescription>
            El cobro se registra con la fecha actual. Si el período vigente no
            ha terminado, se suma la nueva duración al vencimiento actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canPay && member.plan ? (
            <PaymentForm
              action={recordPayment.bind(null, member.id)}
              suggestedAmount={member.plan.price.toString()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Para registrar un cobro, el socio debe estar activo y tener un
              plan asignado.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Últimos cobros</CardTitle>
          <CardDescription>
            Se muestran hasta 50 cobros recientes. Los cobros registrados no se
            eliminan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay cobros registrados para este socio.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Período cubierto</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{dateFormat.format(payment.paidAt)}</TableCell>
                      <TableCell className="font-medium">
                        {currency.format(Number(payment.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {methodNames[payment.method] ?? payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dateFormat.format(payment.periodStart)} —{" "}
                        {dateFormat.format(payment.periodEnd)}
                      </TableCell>
                      <TableCell className="max-w-48 whitespace-normal">
                        {payment.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
