import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

function historyHref(memberId: string, page: number) {
  const path = `/dashboard/members/${encodeURIComponent(memberId)}/payments`;
  return page > 1 ? `${path}?page=${page}#history` : `${path}#history`;
}

export default async function MemberPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await requireOrgSession();
  const [{ id }, queryParams] = await Promise.all([params, searchParams]);
  const rawPage = typeof queryParams.page === "string" ? queryParams.page : "1";
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1;
  const organizationId = session.user.organizationId;
  const [member, history] = await Promise.all([
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
    listPaymentsForMember(organizationId, id, page),
  ]);
  if (!member) notFound();
  const pageCount = Math.max(1, Math.ceil(history.total / history.pageSize));
  if (page > pageCount) redirect(historyHref(id, pageCount));

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
      <Card id="history">
        <CardHeader>
          <CardTitle>Historial de cobros</CardTitle>
          <CardDescription>
            {history.total}{" "}
            {history.total === 1 ? "cobro registrado" : "cobros registrados"}.
            Los cobros no se eliminan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {history.payments.length === 0 ? (
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
                    <TableHead>
                      <span className="sr-only">Comprobante</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.payments.map((payment) => (
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
                      <TableCell>
                        <Link
                          href={`/dashboard/members/${member.id}/payments/${payment.id}/receipt`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          Comprobante
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {pageCount > 1 ? (
            <nav
              aria-label="Páginas de cobros del socio"
              className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
            >
              <span>
                Página {page} de {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={historyHref(id, page - 1)}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Anterior
                  </Link>
                ) : null}
                {page < pageCount ? (
                  <Link
                    href={historyHref(id, page + 1)}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Siguiente
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
