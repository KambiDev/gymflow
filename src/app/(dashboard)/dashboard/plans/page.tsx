import type { Metadata } from "next";
import Link from "next/link";
import { Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireOrgSession } from "@/lib/session";
import { deactivatePlan } from "@/server/actions/plans";
import { listPlans } from "@/server/plans/repository";

import { PlanForm } from "./plan-form";

export const instant = false;
export const metadata: Metadata = { title: "Planes" };

const currency = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
});

export default async function PlansPage() {
  const session = await requireOrgSession();
  const plans = await listPlans(session.user.organizationId);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-col gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          ← Volver al panel
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Planes</h1>
          <p className="text-sm text-muted-foreground">
            Define las membresías de {session.user.organizationName}.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Planes del gimnasio</CardTitle>
            <CardDescription>Los planes desactivados conservan su historial.</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Layers3 aria-hidden /></EmptyMedia>
                  <EmptyTitle>Aún no hay planes</EmptyTitle>
                  <EmptyDescription>Crea el primero para ofrecer membresías a tus socios.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Plan</TableHead><TableHead>Precio</TableHead>
                    <TableHead>Duración</TableHead><TableHead>Estado</TableHead>
                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{currency.format(Number(plan.price))}</TableCell>
                        <TableCell>{plan.durationDays} días</TableCell>
                        <TableCell><Badge variant={plan.active ? "secondary" : "outline"}>{plan.active ? "Activo" : "Inactivo"}</Badge></TableCell>
                        <TableCell>
                          {plan.active ? (
                            <form action={deactivatePlan}>
                              <input type="hidden" name="id" value={plan.id} />
                              <Button type="submit" variant="ghost" size="sm" aria-label={`Desactivar ${plan.name}`}>Desactivar</Button>
                            </form>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo plan</CardTitle>
            <CardDescription>Precio en córdobas y duración en días.</CardDescription>
          </CardHeader>
          <CardContent><PlanForm /></CardContent>
        </Card>
      </div>
    </main>
  );
}
