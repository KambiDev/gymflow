import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Users, Wallet } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

// La home lee la sesión para redirigir a los usuarios autenticados.
export const instant = false;

const highlights = [
  {
    icon: Users,
    title: "Socios",
    description: "Altas, búsqueda y estados en segundos.",
  },
  {
    icon: Wallet,
    title: "Pagos",
    description: "Registra cobros y actualiza vencimientos solo.",
  },
  {
    icon: CalendarClock,
    title: "Atrasos",
    description: "Sabe quién debe y desde cuándo, al instante.",
  },
];

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    redirect(session.user.role === "platform_owner" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-6">
        <BrandLogo />
        <Button
          variant="ghost"
          render={<Link href="/login" />}
          nativeButton={false}
        >
          Iniciar sesión
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Tu gimnasio, ordenado.
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          Socios, membresías y pagos en un solo lugar. GymFlow te dice quién
          pagó, quién vence hoy y quién está atrasado — sin cuadernos.
        </p>
        <Button
          size="lg"
          render={<Link href="/login" />}
          nativeButton={false}
        >
          Iniciar sesión
          <ArrowRight data-icon="inline-end" />
        </Button>

        <dl className="mt-10 grid w-full gap-6 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 rounded-lg border bg-card p-5 text-card-foreground"
            >
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <dt className="font-medium">{title}</dt>
              <dd className="text-sm text-muted-foreground">{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="p-6 text-center text-sm text-muted-foreground">
        GymFlow · Gestión para gimnasios
      </footer>
    </main>
  );
}
