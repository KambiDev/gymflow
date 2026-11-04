import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

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
            Solo se crean socios nuevos y activos, con un plan opcional. Asignar
            un plan no registra pagos ni marca la membresía como pagada. No se
            importan cobros, vencimientos ni notas, y no se actualizan socios
            existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <a
            href="/dashboard/members/import/template"
            className={buttonVariants({
              variant: "outline",
              className: "self-start",
            })}
          >
            <Download data-icon="inline-start" /> Descargar plantilla CSV
          </a>
          <div className="flex flex-col gap-2 text-sm">
            <p>
              La primera fila debe ser exactamente una de estas dos opciones:
            </p>
            <code className="block overflow-x-auto border border-border p-3">
              Nombre,Apellido,Teléfono,Correo
              <br />
              Nombre,Apellido,Teléfono,Correo,Plan
            </code>
            <p>
              Ejemplo con plan:{" "}
              <code>Ana,López,8888 8888,ana@ejemplo.com,Mensual</code>.
              Teléfono, correo y plan pueden quedar vacíos; conserva la columna
              vacía cuando uses el formato de cinco columnas. Escribe el nombre
              del plan tal como aparece en este gimnasio: debe estar activo. Usa
              comillas dobles si un valor contiene comas.
            </p>
            <p>
              La plantilla solo contiene el encabezado: agrega al menos un socio
              antes de importarla. El padrón descargado no es una plantilla de
              importación.
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
