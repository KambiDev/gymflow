import type { Metadata } from "next";
import { ArrowUpRight, Dumbbell } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,1.2fr)_minmax(400px,0.8fr)]">
      <section className="relative hidden min-h-svh flex-col justify-between overflow-hidden border-r-2 border-border bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <BrandLogo
          className="relative z-10 text-primary-foreground"
          markClassName="bg-secondary text-secondary-foreground"
        />
        <div className="pointer-events-none absolute top-1/2 -right-20 -translate-y-1/2 rotate-[-19deg] border-[24px] border-primary-foreground/10 p-12 xl:right-0">
          <Dumbbell
            className="size-72 xl:size-96"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <div className="relative z-10 flex max-w-2xl flex-col gap-7">
          <h1 className="text-6xl leading-[0.92] font-black tracking-[-0.08em] text-balance xl:text-8xl">
            El control se entrena todos los días.
          </h1>
          <p className="max-w-md border-l-4 border-secondary pl-5 text-lg leading-relaxed text-primary-foreground/90">
            Socios, membresías y cobros en un solo lugar. Menos tiempo buscando
            datos; más tiempo para tu gimnasio.
          </p>
        </div>
        <div className="relative z-10 flex items-center justify-between border-t-2 border-primary-foreground/50 pt-5 text-sm font-semibold">
          <span>GymFlow · Gestión para gimnasios</span>
          <ArrowUpRight aria-hidden />
        </div>
      </section>

      <section className="flex min-h-svh items-center justify-center p-6 sm:p-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="lg:hidden">
            <BrandLogo />
          </div>
          <div className="border-b-2 border-border pb-5">
            <p className="mb-3 font-mono text-xs font-bold text-muted-foreground">
              Acceso a GymFlow
            </p>
            <h2 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Entra al panel.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Usa el correo y la contraseña de tu gimnasio.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
