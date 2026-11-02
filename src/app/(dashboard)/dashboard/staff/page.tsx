import type { Metadata } from "next";
import Link from "next/link";

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
import { requireOrgAdmin } from "@/lib/session";
import { changeStaffStatus } from "@/server/actions/staff";
import { listStaff } from "@/server/staff/repository";

import { StaffForm } from "./staff-form";

export const instant = false;
export const metadata: Metadata = { title: "Personal del gimnasio" };

export default async function StaffPage() {
  const session = await requireOrgAdmin();
  const staff = await listStaff(session.user.organizationId);
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href="/dashboard"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver al panel
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Personal del gimnasio
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea cuentas de recepción y controla su acceso a{" "}
          {session.user.organizationName}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nueva cuenta</CardTitle>
          <CardDescription>
            El personal puede gestionar socios, planes y cobros, pero no otras
            cuentas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cuentas de personal</CardTitle>
          <CardDescription>
            Desactivar una cuenta bloquea su próximo inicio de sesión y sus
            solicitudes posteriores, incluso si ya tenía una sesión abierta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay cuentas de personal.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">
                        {person.name}
                      </TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={person.active ? "secondary" : "outline"}
                        >
                          {person.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/staff/${person.id}/password`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            Restablecer contraseña
                          </Link>
                          <form action={changeStaffStatus}>
                            <input type="hidden" name="id" value={person.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={person.active ? "inactive" : "active"}
                            />
                            <Button
                              type="submit"
                              variant={person.active ? "outline" : "secondary"}
                              size="sm"
                            >
                              {person.active ? "Desactivar" : "Reactivar"}
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
