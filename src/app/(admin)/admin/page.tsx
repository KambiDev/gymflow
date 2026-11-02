import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePlatformOwner } from "@/lib/session";
import { signOutAction } from "@/server/actions/auth";
import { listOrganizations } from "@/server/organizations/repository";
import { platformBillingStatus } from "@/server/organizations/validation";

// Las rutas autenticadas leen la sesión en cada request, por lo que no
// pueden prerenderizarse como shell estático (Cache Components).
export const instant = false;

export const metadata: Metadata = {
  title: "Panel de plataforma",
};

const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
  timeZone: "America/Managua",
});

function BillingBadge({
  paidUntil,
  now,
}: {
  paidUntil: Date | null;
  now: Date;
}) {
  const billing = platformBillingStatus(paidUntil, now);
  return (
    <Badge variant={billing === "overdue" ? "destructive" : "outline"}>
      {billing === "current"
        ? "Al día"
        : billing === "overdue"
          ? "Vencido"
          : "Sin registrar"}
    </Badge>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await requirePlatformOwner();
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const page = /^\d{1,6}$/.test(rawPage) ? Math.max(1, Number(rawPage)) : 1;
  const { organizations, total, pageSize } = await listOrganizations(page);
  const now = new Date();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount)
    redirect(pageCount > 1 ? `/admin?page=${pageCount}` : "/admin");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 p-5 md:p-8 lg:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border pb-6">
        <div className="flex flex-col gap-1">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">Panel de plataforma</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/account/password"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Mi contraseña
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-6xl">
            Gimnasios.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Administra el acceso y los cobros de la plataforma.
          </p>
        </div>
        <Link
          href="/admin/new"
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          Registrar gimnasio
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio de gimnasios</CardTitle>
          <CardDescription>
            {total === 0
              ? "Aún no hay gimnasios registrados."
              : `${total} gimnasio(s) en la plataforma. El estado de acceso se controla manualmente.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Pagado hasta</TableHead>
                  <TableHead>Cobro B2B</TableHead>
                  <TableHead>Socios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell className="font-medium">
                      {organization.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {organization.contactEmail ??
                        organization.contactPhone ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      {organization.subscriptionPaidUntil
                        ? dateFormat.format(organization.subscriptionPaidUntil)
                        : "Sin registrar"}
                    </TableCell>
                    <TableCell>
                      <BillingBadge
                        paidUntil={organization.subscriptionPaidUntil}
                        now={now}
                      />
                    </TableCell>
                    <TableCell>{organization._count.members}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          organization.status === "active"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {organization.status === "active"
                          ? "Activo"
                          : "Suspendido"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/${organization.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Gestionar
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 ? (
            <nav
              aria-label="Páginas de gimnasios"
              className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
            >
              <span>
                Página {page} de {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={page === 2 ? "/admin" : `/admin?page=${page - 1}`}
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
                    href={`/admin?page=${page + 1}`}
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
