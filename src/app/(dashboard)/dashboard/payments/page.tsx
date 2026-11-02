import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOrgSession } from "@/lib/session";
import { dueDateWindow } from "@/server/dues/dates";
import {
  getDailyPaymentReport,
  paymentDayWindow,
} from "@/server/payments/daily-report";

export const instant = false;
export const metadata: Metadata = { title: "Cierre diario de cobros" };

const currency = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
});
const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "long",
  timeZone: "America/Managua",
});
const timeFormat = new Intl.DateTimeFormat("es-NI", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Managua",
});
const methodNames: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

function pageHref(day: string, page: number) {
  const params = new URLSearchParams({ date: day });
  if (page > 1) params.set("page", String(page));
  return `/dashboard/payments?${params}`;
}

export default async function DailyPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[]; page?: string | string[] }>;
}) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const today = dueDateWindow(new Date()).today.toISOString().slice(0, 10);
  const day =
    params.date === undefined
      ? today
      : typeof params.date === "string"
        ? params.date
        : "";
  const window = paymentDayWindow(day);
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1;
  const report = window
    ? await getDailyPaymentReport(session.user.organizationId, day, page)
    : null;
  const pageCount = report
    ? Math.max(1, Math.ceil(report.count / report.pageSize))
    : 1;
  if (report && page > pageCount) redirect(pageHref(day, pageCount));

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href="/dashboard"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver al panel
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cierre diario de cobros
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulta de cobros registrados por fecha de Nicaragua. No modifica
          pagos ni cierra la caja.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar fecha</CardTitle>
          <CardDescription>
            El día comienza a las 00:00 y termina antes de las 00:00 del
            siguiente día, hora de Nicaragua.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action="/dashboard/payments"
            method="get"
            className="flex flex-wrap items-end gap-3"
          >
            <Field className="w-auto">
              <FieldLabel htmlFor="report-date">Fecha de cobros</FieldLabel>
              <Input
                id="report-date"
                name="date"
                type="date"
                defaultValue={window ? day : ""}
                required
              />
            </Field>
            <Button type="submit">Consultar</Button>
          </form>
          {!window ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Selecciona una fecha válida.{" "}
              <Link href={pageHref(today, 1)} className="underline">
                Ver hoy
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {report && window ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>
                  Resumen del {dateFormat.format(window.start)}
                </CardTitle>
                <a
                  href={`/dashboard/payments/export?date=${encodeURIComponent(day)}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Download data-icon="inline-start" /> Descargar CSV
                </a>
              </div>
              <CardDescription>
                Importes en córdobas · {report.count}{" "}
                {report.count === 1 ? "cobro" : "cobros"} registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="text-3xl font-bold tabular-nums">
                Total: {currency.format(Number(report.total.toFixed(2)))}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {report.methods.map((group) => (
                  <div key={group.method} className="border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      {methodNames[group.method] ?? group.method} ·{" "}
                      {group.count}
                    </p>
                    <p className="text-xl font-semibold tabular-nums">
                      {currency.format(Number(group.amount.toFixed(2)))}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalle de cobros</CardTitle>
              <CardDescription>
                Historial de la fecha seleccionada, ordenado del más reciente al
                más antiguo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {report.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay cobros registrados en esta fecha.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {timeFormat.format(payment.paidAt)}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/dashboard/members/${payment.member.id}/payments`}
                              className="underline underline-offset-2"
                            >
                              {payment.member.firstName}{" "}
                              {payment.member.lastName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {methodNames[payment.method] ?? payment.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {currency.format(Number(payment.amount.toFixed(2)))}
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
              {pageCount > 1 ? (
                <nav
                  aria-label="Páginas de cobros"
                  className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
                >
                  <span>
                    Página {page} de {pageCount}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 ? (
                      <Link
                        href={pageHref(day, page - 1)}
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
                        href={pageHref(day, page + 1)}
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
        </>
      ) : null}
    </main>
  );
}
