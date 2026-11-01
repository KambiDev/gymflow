import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutAction } from "@/server/actions/auth";

export default function SuspendedPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <BrandLogo />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso no disponible</CardTitle>
          <CardDescription>
            Tu gimnasio no tiene acceso a la plataforma en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <form action={signOutAction}>
            <Button type="submit">Cerrar sesión</Button>
          </form>
          <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
