import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ClipboardList, UsersRound } from "lucide-react";

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
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 p-5 md:p-8 lg:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border pb-6">
        <div className="flex flex-col gap-1">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">
            {session.user.organizationName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {session.user.role === "admin" ? "Administrador" : "Personal"}
          </Badge>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <Card className="bg-primary text-primary-foreground shadow-[7px_7px_0_var(--foreground)] [--card-spacing:--spacing(6)] md:[--card-spacing:--spacing(8)]">
        <CardHeader className="gap-3">
          <CardDescription className="font-mono text-xs font-semibold text-primary-foreground/85">
            Panel de {session.user.organizationName}
          </CardDescription>
          <CardTitle className="max-w-3xl text-4xl leading-none font-black tracking-[-0.065em] text-balance sm:text-5xl md:text-6xl">
            Tu gimnasio. Todo bajo control.
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6">
          <p className="max-w-xl text-base text-primary-foreground/90">
            Hola, {session.user.name}. Revisa los vencimientos y mantén al día a
            tus socios.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/members"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <UsersRound data-icon="inline-start" /> Gestionar socios
            </Link>
            <Link
              href="/dashboard/plans"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <ClipboardList data-icon="inline-start" /> Gestionar planes
            </Link>
            {session.user.role === "admin" ? (
              <Link
                href="/dashboard/staff"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Gestionar personal
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section
        aria-labelledby="dues-heading"
        className="flex flex-col gap-5 pt-3"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="dues-heading"
              className="text-3xl font-black tracking-[-0.05em] sm:text-4xl"
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
            Ver todos los vencimientos <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card size="sm" className="bg-secondary">
            <CardHeader>
              <CardDescription>Atrasados</CardDescription>
              <CardTitle className="text-5xl font-black tabular-nums">
                {dues.overdue}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm" className="bg-accent">
            <CardHeader>
              <CardDescription>Vencen en 7 días</CardDescription>
              <CardTitle className="text-5xl font-black tabular-nums">
                {dues.upcoming}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Sin pagos</CardDescription>
              <CardTitle className="text-5xl font-black tabular-nums">
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
