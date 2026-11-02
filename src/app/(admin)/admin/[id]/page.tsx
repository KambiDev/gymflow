import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePlatformOwner } from "@/lib/session";
import {
  changeOrganizationStatus,
  updateOrganizationPaidUntil,
} from "@/server/actions/organizations";
import { findOrganization } from "@/server/organizations/repository";
import {
  paidUntilInputValue,
  platformBillingStatus,
} from "@/server/organizations/validation";

import { BillingForm } from "./billing-form";

export const instant = false;
export const metadata: Metadata = { title: "Gestionar gimnasio" };

const dateFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "long",
  timeZone: "America/Managua",
});

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformOwner();
  const { id } = await params;
  const organization = await findOrganization(id);
  if (!organization) notFound();
  const isSuspended = organization.status === "suspended";
  const paidUntil = organization.subscriptionPaidUntil;
  const billingStatus = platformBillingStatus(paidUntil);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href="/admin"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver a gimnasios
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {organization.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {organization._count.members} socios · {organization._count.plans}{" "}
            planes
          </p>
        </div>
        <Badge variant={isSuspended ? "destructive" : "secondary"}>
          {isSuspended ? "Suspendido" : "Activo"}
        </Badge>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Contacto y acceso</CardTitle>
          <CardDescription>Administradores del gimnasio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="font-medium">Contacto:</span>{" "}
            {organization.contactName ?? "—"}
          </p>
          <p>
            <span className="font-medium">Correo:</span>{" "}
            {organization.contactEmail ?? "—"}
          </p>
          <p>
            <span className="font-medium">Teléfono:</span>{" "}
            {organization.contactPhone ?? "—"}
          </p>
          {organization.users.length === 0 ? (
            <p>No hay administradores registrados.</p>
          ) : (
            <ul className="flex flex-col gap-3 pt-2">
              {organization.users.map((admin) => (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    {admin.name} · {admin.email}
                  </span>
                  <Link
                    href={`/admin/${organization.id}/admins/${admin.id}/password`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Restablecer contraseña
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cobro de la plataforma</CardTitle>
          <CardDescription>
            {paidUntil
              ? `Registrado hasta el ${dateFormat.format(paidUntil)}. ${billingStatus === "overdue" ? "Cobro vencido." : "Cobro al día."}`
              : "Todavía no hay una fecha de pago registrada."}{" "}
            Este registro es manual y no suspende al gimnasio automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingForm
            action={updateOrganizationPaidUntil.bind(null, organization.id)}
            paidUntil={paidUntilInputValue(paidUntil)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Acceso al gimnasio</CardTitle>
          <CardDescription>
            {isSuspended
              ? "Reactivar permitirá iniciar sesión y volver a usar las sesiones existentes."
              : "Suspender bloqueará los nuevos inicios de sesión y las sesiones existentes en sus próximas solicitudes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={changeOrganizationStatus}>
            <input type="hidden" name="id" value={organization.id} />
            <input
              type="hidden"
              name="status"
              value={isSuspended ? "active" : "suspended"}
            />
            <Button
              type="submit"
              variant={isSuspended ? "outline" : "destructive"}
            >
              {isSuspended ? "Reactivar gimnasio" : "Suspender acceso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
