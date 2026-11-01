import "server-only";

import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { canAccessOrganization, canManageStaff } from "@/lib/account-access";
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
    select: {
      active: true,
      role: true,
      organizationId: true,
      organization: { select: { status: true } },
    },
  });

  if (
    !user?.active ||
    user.role !== session.user.role ||
    user.organizationId !== session.user.organizationId
  ) {
    redirect("/login");
  }

  if (
    !canAccessOrganization(user, {
      role: session.user.role,
      organizationId: session.user.organizationId,
    })
  ) {
    redirect("/suspended");
  }

  return session as OrgSession;
}

export async function requireOrgAdmin(): Promise<OrgSession> {
  const session = await requireOrgSession();
  if (!canManageStaff(session.user.role)) redirect("/dashboard");
  return session;
}

export async function requirePlatformOwner(): Promise<Session> {
  const session = await requireSession();

  if (session.user.role !== "platform_owner") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { active: true, role: true },
  });
  if (!user?.active || user.role !== "platform_owner") redirect("/login");

  return session;
}
