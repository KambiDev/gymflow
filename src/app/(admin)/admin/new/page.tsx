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
import { requirePlatformOwner } from "@/lib/session";

import { OrganizationForm } from "./organization-form";

export const instant = false;
export const metadata: Metadata = { title: "Registrar gimnasio" };

export default async function NewOrganizationPage() {
  await requirePlatformOwner();
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
      <Card>
        <CardHeader>
          <CardTitle>Registrar gimnasio</CardTitle>
          <CardDescription>
            Se creará el gimnasio y su primer administrador en una sola
            operación. El acceso inicia activo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </main>
  );
}
