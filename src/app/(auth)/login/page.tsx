import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <Dumbbell
          className="pointer-events-none absolute -right-12 -bottom-12 size-72 text-background/5"
          strokeWidth={1}
          aria-hidden
        />
        <BrandLogo
          className="text-background"
          markClassName="bg-background text-foreground"
        />
        <div className="relative flex max-w-md flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Tu gimnasio, ordenado.
          </h1>
          <p className="text-lg text-background/70">
            Socios, membresías y pagos en un solo lugar. Sin cuadernos, sin
            sorpresas.
          </p>
        </div>
        <p className="relative text-sm text-background/50">
          GymFlow · Gestión para gimnasios
        </p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Inicia sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Accede con las credenciales de tu gimnasio.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
