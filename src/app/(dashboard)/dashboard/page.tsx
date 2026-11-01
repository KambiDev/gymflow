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

// Las rutas autenticadas leen la sesión en cada request, por lo que no
// pueden prerenderizarse como shell estático (Cache Components).
export const instant = false;

export const metadata: Metadata = {
  title: "Panel",
};

export default async function DashboardPage() {
  const session = await requireOrgSession();

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
            Gestiona las membresías de tu gimnasio desde aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">Configura los planes de {session.user.organizationName} antes de registrar socios.</p>
          <Link href="/dashboard/plans" className={buttonVariants({ variant: "default" })}>Gestionar planes</Link>
        </CardContent>
      </Card>
    </main>
  );
}
