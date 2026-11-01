import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
            La gestión de socios y pagos llega en la siguiente fase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tu sesión está activa y aislada por gimnasio. Aquí verás el panel de{" "}
            {session.user.organizationName}.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
