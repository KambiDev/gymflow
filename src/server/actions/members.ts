"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgSession } from "@/lib/session";
import {
  createMemberForOrg,
  MemberPlanUnavailableError,
  setMemberStatusForOrg,
  updateMemberForOrg,
} from "@/server/members/repository";
import { memberSchema, memberStatusSchema } from "@/server/members/validation";

export type MemberFormState = { error?: string };

function parseMember(formData: FormData) {
  return memberSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    planId: formData.get("planId"),
    notes: formData.get("notes"),
  });
}

export async function createMember(
  _state: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const session = await requireOrgSession();
  const parsed = parseMember(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del socio.",
    };
  }

  try {
    await createMemberForOrg(session.user.organizationId, parsed.data);
  } catch (error) {
    if (error instanceof MemberPlanUnavailableError)
      return { error: error.message };
    throw error;
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  redirect("/dashboard/members");
}

export async function updateMember(
  id: string,
  _state: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const session = await requireOrgSession();
  if (!id || id.length > 100) return { error: "Socio no encontrado." };

  const parsed = parseMember(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del socio.",
    };
  }

  try {
    const updated = await updateMemberForOrg(
      session.user.organizationId,
      id,
      parsed.data,
    );
    if (!updated) return { error: "Socio no encontrado." };
  } catch (error) {
    if (error instanceof MemberPlanUnavailableError)
      return { error: error.message };
    throw error;
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  redirect("/dashboard/members");
}

export async function changeMemberStatus(formData: FormData) {
  const session = await requireOrgSession();
  const id = formData.get("id");
  const status = memberStatusSchema.safeParse(formData.get("status"));

  if (typeof id !== "string" || !id || id.length > 100 || !status.success)
    return;

  await setMemberStatusForOrg(session.user.organizationId, id, status.data);
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
}
