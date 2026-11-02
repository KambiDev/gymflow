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
import { requireOrgAdmin } from "@/lib/session";
import { resetStaffPassword } from "@/server/actions/password-reset";
import { findManagedAccount } from "@/server/account/repository";

export const instant = false;
export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function StaffPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOrgAdmin();
  const { id } = await params;
  const person = await findManagedAccount(
    session.user.organizationId,
    id,
    "staff",
  );
  if (!person) notFound();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href="/dashboard/staff"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver a personal
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Restablecer contraseña de {person.name}</CardTitle>
          <CardDescription>
            Cuenta: {person.email}. Se cerrarán todas sus sesiones abiertas.{" "}
            {person.active
              ? "La cuenta seguirá activa."
              : "La cuenta seguirá inactiva hasta que la reactives."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetForm
            action={resetStaffPassword.bind(null, person.id)}
          />
        </CardContent>
      </Card>
    </main>
  );
}
