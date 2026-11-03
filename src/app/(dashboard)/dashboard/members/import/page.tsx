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
import { requireOrgAdmin } from "@/lib/session";

import { MemberImportForm } from "./import-form";

export const instant = false;
export const metadata: Metadata = { title: "Importar socios" };

export default async function MemberImportPage() {
  await requireOrgAdmin();
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6 lg:p-10">
      <Link
        href="/dashboard/members"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        ← Volver a socios
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Importar socios desde CSV</CardTitle>
          <CardDescription>
            Solo se crean socios nuevos, activos y sin plan. No se importan
            cobros, vencimientos ni notas, y no se actualizan socios existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-sm">
            <p>La primera fila debe ser exactamente:</p>
            <code className="block overflow-x-auto border border-border p-3">
              Nombre,Apellido,Teléfono,Correo
            </code>
            <p>
              Ejemplo de fila: <code>Ana,López,8888 8888,ana@ejemplo.com</code>.
              Teléfono y correo pueden quedar vacíos. Usa comillas dobles si un
              valor contiene comas.
            </p>
            <p className="text-muted-foreground">
              Revisa el archivo antes de enviarlo. Se rechazan correos repetidos
              dentro del archivo o ya usados por socios de este gimnasio; si un
              socio no tiene correo, revisa manualmente que no esté duplicado.
            </p>
          </div>
          <MemberImportForm />
        </CardContent>
      </Card>
    </main>
  );
}
