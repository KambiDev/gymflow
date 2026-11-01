import "server-only";

import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type OrgSession = Session & {
  user: Session["user"] & { organizationId: string };
};

export async function requireSession(): Promise<Session> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

export async function requireOrgSession(): Promise<OrgSession> {
  const session = await requireSession();

  if (session.user.role === "platform_owner") {
    redirect("/admin");
  }

  if (!session.user.organizationId) {
    redirect("/login");
  }

  // The JWT may outlive an organization's subscription. Check the current
  // database state on every protected read and mutation, not only at login.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, organization: { select: { status: true } } },
  });

  if (
    user?.organizationId !== session.user.organizationId ||
    user.organization?.status !== "active"
  ) {
    redirect("/suspended");
  }

  return session as OrgSession;
}

export async function requirePlatformOwner(): Promise<Session> {
  const session = await requireSession();

  if (session.user.role !== "platform_owner") {
    redirect("/dashboard");
  }

  return session;
}
