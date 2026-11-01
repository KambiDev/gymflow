import type { Metadata } from "next";
import Link from "next/link";

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
import { requireOrgSession } from "@/lib/session";
import { signOutAction } from "@/server/actions/auth";
import { getDuesSummary } from "@/server/dues/repository";

// Las rutas autenticadas leen la sesión en cada request, por lo que no
// pueden prerenderizarse como shell estático (Cache Components).
export const instant = false;

export const metadata: Metadata = {
  title: "Panel",
};

const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "medium",
  timeZone: "America/Managua",
});

export default async function DashboardPage() {
  const session = await requireOrgSession();
  const dues = await getDuesSummary(session.user.organizationId);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">
            {session.user.organizationName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {session.user.role === "admin" ? "Administrador" : "Staff"}
          </Badge>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Hola, {session.user.name}</CardTitle>
          <CardDescription>
            Gestiona socios, planes y cobros de tu gimnasio desde aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            El registro de {session.user.organizationName} está listo para
            crecer.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/members"
              className={buttonVariants({ variant: "default" })}
            >
              Gestionar socios
            </Link>
            <Link
              href="/dashboard/plans"
              className={buttonVariants({ variant: "outline" })}
            >
              Gestionar planes
            </Link>
            {session.user.role === "admin" ? (
              <Link
                href="/dashboard/staff"
                className={buttonVariants({ variant: "outline" })}
              >
                Gestionar personal
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="dues-heading" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="dues-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              Vencimientos
            </h2>
            <p className="text-sm text-muted-foreground">
              Fechas del gimnasio en horario de Nicaragua. Solo socios activos.
            </p>
          </div>
          <Link
            href="/dashboard/alerts"
            className={buttonVariants({ variant: "outline" })}
          >
            Ver todos los vencimientos
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Atrasados</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {dues.overdue}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Vencen en 7 días</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {dues.upcoming}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Sin pagos</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {dues.unpaid}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground">
          {dues.active} socios activos · Un vencimiento de hoy todavía no está
          atrasado.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Atender primero</CardTitle>
              <CardDescription>
                Los cinco vencimientos más antiguos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dues.overdueMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay socios atrasados.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dues.overdueMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">
                          {member.firstName} {member.lastName}
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          Venció el {dateFormat.format(member.nextPaymentDate!)}
                        </span>
                      </span>
                      <Link
                        href={`/dashboard/members/${member.id}/payments`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Ver cobros
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Próximos vencimientos</CardTitle>
              <CardDescription>Hoy y los siguientes seis días.</CardDescription>
            </CardHeader>
            <CardContent>
              {dues.upcomingMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay vencimientos próximos.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dues.upcomingMembers.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">
                          {member.firstName} {member.lastName}
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          Vence el {dateFormat.format(member.nextPaymentDate!)}
                        </span>
                      </span>
                      <Link
                        href={`/dashboard/members/${member.id}/payments`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Ver cobros
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
