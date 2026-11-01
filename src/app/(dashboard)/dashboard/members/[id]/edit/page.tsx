import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgSession } from "@/lib/session";
import { updateMember } from "@/server/actions/members";
import { findMember, listAvailablePlans } from "@/server/members/repository";

import { MemberForm } from "../../member-form";

export const instant = false;
export const metadata: Metadata = { title: "Editar socio" };

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireOrgSession();
  const { id } = await params;
  const member = await findMember(session.user.organizationId, id);
  if (!member) notFound();

  const plans = await listAvailablePlans(
    session.user.organizationId,
    member.planId,
  );
  const action = updateMember.bind(null, member.id);

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
          <CardTitle>Editar socio</CardTitle>
          <CardDescription>
            {member.firstName} {member.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm
            plans={plans}
            initial={member}
            action={action}
            submitLabel="Guardar cambios"
          />
        </CardContent>
      </Card>
    </main>
  );
}
