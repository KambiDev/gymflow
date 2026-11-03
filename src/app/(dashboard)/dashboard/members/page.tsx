import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download,
  Search,
  Upload,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { changeMemberStatus } from "@/server/actions/members";
import { listMembers } from "@/server/members/repository";

export const instant = false;
export const metadata: Metadata = { title: "Socios" };

type SearchParams = Promise<{
  q?: string | string[];
  page?: string | string[];
}>;

function pageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `/dashboard/members${suffix ? `?${suffix}` : ""}`;
}

const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
  timeZone: "America/Managua",
});

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "")
    .trim()
    .slice(0, 80);
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1;
  const { members, total, pageSize } = await listMembers(
    session.user.organizationId,
    query,
    page,
  );
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount) redirect(pageHref(pageCount, query));

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-col gap-4">
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">Socios</h1>
            <p className="text-sm text-muted-foreground">
              Registro de {session.user.organizationName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.user.role === "admin" ? (
              <>
                <Link
                  href="/dashboard/members/import"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Upload data-icon="inline-start" /> Importar CSV
                </Link>
                <a
                  href="/dashboard/members/export"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Download data-icon="inline-start" /> Descargar padrón CSV
                </a>
              </>
            ) : null}
            <Link
              href="/dashboard/members/new"
              className={buttonVariants({ variant: "default" })}
            >
              Nuevo socio
            </Link>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Registro de socios</CardTitle>
          <CardDescription>
            {total} {total === 1 ? "socio encontrado" : "socios encontrados"}.
            Activo indica que el socio está inscrito, no que haya pagado.
            {session.user.role === "admin"
              ? " La descarga incluye todos los socios del gimnasio, incluso los inactivos; protege el archivo porque contiene datos personales."
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form
            action="/dashboard/members"
            method="get"
            className="flex flex-wrap items-center gap-2"
          >
            <FieldGroup className="min-w-48 w-auto flex-1">
              <Field>
                <FieldLabel htmlFor="member-search" className="sr-only">
                  Buscar socios
                </FieldLabel>
                <Input
                  id="member-search"
                  name="q"
                  type="search"
                  defaultValue={query}
                  placeholder="Nombre, teléfono o correo"
                  maxLength={80}
                />
              </Field>
            </FieldGroup>
            <Button type="submit" variant="outline">
              <Search data-icon="inline-start" />
              Buscar
            </Button>
          </form>

          {members.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersRound aria-hidden />
                </EmptyMedia>
                <EmptyTitle>
                  {query ? "Sin resultados" : "Aún no hay socios"}
                </EmptyTitle>
                <EmptyDescription>
                  {query
                    ? "Prueba otro nombre, teléfono o correo."
                    : "Registra al primer socio de tu gimnasio."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {query ? (
                  <Link
                    href="/dashboard/members"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Limpiar búsqueda
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/members/new"
                    className={buttonVariants({ variant: "default" })}
                  >
                    <UserRoundPlus data-icon="inline-start" /> Nuevo socio
                  </Link>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Próximo pago</TableHead>
                    <TableHead>Alta</TableHead>
                    <TableHead>Estado</TableHead>
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
                      <TableCell className="text-muted-foreground">
                        {member.phone || member.email || "—"}
                      </TableCell>
                      <TableCell>{member.plan?.name ?? "Sin plan"}</TableCell>
                      <TableCell>
                        {member.nextPaymentDate
                          ? dateFormat.format(member.nextPaymentDate)
                          : "Sin pagos"}
                      </TableCell>
                      <TableCell>
                        {dateFormat.format(member.startedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "active" ? "secondary" : "outline"
                          }
                        >
                          {member.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/members/${member.id}/payments`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            Cobros
                          </Link>
                          <Link
                            href={`/dashboard/members/${member.id}/edit`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            Editar
                          </Link>
                          <form action={changeMemberStatus}>
                            <input type="hidden" name="id" value={member.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={
                                member.status === "active"
                                  ? "inactive"
                                  : "active"
                              }
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              aria-label={`${member.status === "active" ? "Dar de baja a" : "Reactivar a"} ${member.firstName} ${member.lastName}`}
                            >
                              {member.status === "active"
                                ? "Dar de baja"
                                : "Reactivar"}
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pageCount > 1 ? (
            <nav
              aria-label="Páginas de socios"
              className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
            >
              <span>
                Página {page} de {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1, query)}
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
                    href={pageHref(page + 1, query)}
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
