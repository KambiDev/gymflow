import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PasswordResetForm } from "@/components/password-reset-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePlatformOwner } from "@/lib/session";
import { resetGymAdminPassword } from "@/server/actions/password-reset";
import { findManagedAccount } from "@/server/account/repository";
import { findOrganization } from "@/server/organizations/repository";

export const instant = false;
export const metadata: Metadata = { title: "Restablecer acceso del gimnasio" };

export default async function GymAdminPasswordPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  await requirePlatformOwner();
  const { id, userId } = await params;
  const [organization, admin] = await Promise.all([
    findOrganization(id),
    findManagedAccount(id, userId, "admin"),
  ]);
  if (!organization || !admin) notFound();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href={`/admin/${organization.id}`}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver al gimnasio
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Restablecer acceso de {admin.name}</CardTitle>
          <CardDescription>
            Administrador de {organization.name}: {admin.email}. Se cerrarán sus
            sesiones abiertas.{" "}
            {organization.status === "suspended"
              ? "El gimnasio seguirá suspendido."
              : "El acceso del gimnasio no cambiará."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetForm
            action={resetGymAdminPassword.bind(null, organization.id, admin.id)}
          />
        </CardContent>
      </Card>
    </main>
  );
}
