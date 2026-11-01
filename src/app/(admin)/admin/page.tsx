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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePlatformOwner } from "@/lib/session";
import { signOutAction } from "@/server/actions/auth";

// Las rutas autenticadas leen la sesión en cada request, por lo que no
// pueden prerenderizarse como shell estático (Cache Components).
export const instant = false;

export const metadata: Metadata = {
  title: "Panel de plataforma",
};

export default async function AdminPage() {
  await requirePlatformOwner();

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">
            Panel de plataforma
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Gimnasios</CardTitle>
          <CardDescription>
            {organizations.length === 0
              ? "Aún no hay gimnasios registrados."
              : `${organizations.length} gimnasio(s) en la plataforma.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
