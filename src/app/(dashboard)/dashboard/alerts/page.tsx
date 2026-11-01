import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOrgSession } from "@/lib/session";
import { listDues, type DueCategory } from "@/server/dues/repository";

export const instant = false;
export const metadata: Metadata = { title: "Vencimientos" };

const labels: Record<DueCategory, string> = {
  overdue: "Atrasados",
  upcoming: "Próximos 7 días",
  unpaid: "Sin pagos",
};
const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
  timeZone: "America/Managua",
});

function pageHref(category: DueCategory, page: number) {
  const params = new URLSearchParams({ status: category });
  if (page > 1) params.set("page", String(page));
  return `/dashboard/alerts?${params}`;
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
    page?: string | string[];
  }>;
}) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const category: DueCategory =
    params.status === "upcoming" || params.status === "unpaid"
      ? params.status
      : "overdue";
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1;
  const { members, total, pageSize } = await listDues(
    session.user.organizationId,
    category,
    page,
  );
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount) redirect(pageHref(category, pageCount));

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
        <h1 className="text-3xl font-semibold tracking-tight">Vencimientos</h1>
        <p className="text-sm text-muted-foreground">
          Solo socios activos de {session.user.organizationName}. Fecha local de
          Nicaragua; hoy aún no cuenta como atraso.
        </p>
      </header>
      <nav aria-label="Filtrar vencimientos" className="flex flex-wrap gap-2">
        {(Object.keys(labels) as DueCategory[]).map((item) => (
          <Link
            key={item}
            href={pageHref(item, 1)}
            aria-current={category === item ? "page" : undefined}
            className={buttonVariants({
              variant: category === item ? "default" : "outline",
              size: "sm",
            })}
          >
            {labels[item]}
          </Link>
        ))}
      </nav>
      <Card>
        <CardHeader>
          <CardTitle>{labels[category]}</CardTitle>
          <CardDescription>
            {total} {total === 1 ? "socio" : "socios"}.{" "}
            {category === "unpaid"
              ? "No se consideran atrasados hasta que exista un primer vencimiento."
              : "Abre cobros para consultar el historial o registrar un pago."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {members.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No hay socios en esta categoría</EmptyTitle>
                <EmptyDescription>
                  Prueba otro filtro o vuelve al panel.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.plan?.name ?? "Sin plan"}</TableCell>
                      <TableCell>{member.phone ?? "—"}</TableCell>
                      <TableCell>
                        {member.nextPaymentDate ? (
                          <Badge
                            variant={
                              category === "overdue"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {dateFormat.format(member.nextPaymentDate)}
                          </Badge>
                        ) : (
                          "Sin pagos"
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/members/${member.id}/payments`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          Ver cobros
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
              aria-label="Páginas de vencimientos"
              className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
            >
              <span>
                Página {page} de {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(category, page - 1)}
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
                    href={pageHref(category, page + 1)}
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
