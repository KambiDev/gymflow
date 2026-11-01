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
import { requireOrgSession } from "@/lib/session";
import { createMember } from "@/server/actions/members";
import { listAvailablePlans } from "@/server/members/repository";

import { MemberForm } from "../member-form";

export const instant = false;
export const metadata: Metadata = { title: "Nuevo socio" };

export default async function NewMemberPage() {
  const session = await requireOrgSession();
  const plans = await listAvailablePlans(session.user.organizationId);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6 lg:p-10">
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
          <CardTitle>Nuevo socio</CardTitle>
          <CardDescription>
            Los campos de contacto y plan se pueden completar más adelante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm
            plans={plans}
            action={createMember}
            submitLabel="Registrar socio"
          />
        </CardContent>
      </Card>
    </main>
  );
}
