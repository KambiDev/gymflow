"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrgSession } from "@/lib/session";
import {
  PaymentMemberUnavailableError,
  recordPaymentForOrg,
} from "@/server/payments/repository";
import { paymentSchema } from "@/server/payments/validation";

export type PaymentFormState = { error?: string };

export async function recordPayment(
  memberId: string,
  _state: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const session = await requireOrgSession();
  if (!memberId || memberId.length > 100)
    return { error: "Socio no encontrado." };

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    notes: formData.get("notes"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Revisa el pago." };

  try {
    await recordPaymentForOrg(
      session.user.organizationId,
      memberId,
      parsed.data,
    );
  } catch (error) {
    if (error instanceof PaymentMemberUnavailableError)
      return { error: error.message };
    throw error;
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/alerts");
  revalidatePath(`/dashboard/members/${memberId}/payments`);
  redirect(`/dashboard/members/${memberId}/payments`);
}
