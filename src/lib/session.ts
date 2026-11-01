import "server-only";

import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

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

  return session as OrgSession;
}

export async function requirePlatformOwner(): Promise<Session> {
  const session = await requireSession();

  if (session.user.role !== "platform_owner") {
    redirect("/dashboard");
  }

  return session;
}
