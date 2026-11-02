import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requireOrgSession,
  requirePlatformOwner,
  requireSession,
} from "@/lib/session";

import { PasswordForm } from "./password-form";

export const instant = false;
export const metadata: Metadata = { title: "Cambiar contraseña" };

export default async function PasswordPage() {
  const signedIn = await requireSession();
  const session =
    signedIn.user.role === "platform_owner"
      ? await requirePlatformOwner()
      : await requireOrgSession();
  const back = session.user.role === "platform_owner" ? "/admin" : "/dashboard";

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href={back}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver al panel
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Cuenta: {session.user.email}. Después del cambio se cerrarán todas
            las sesiones de esta cuenta. Inicia sesión con la nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
