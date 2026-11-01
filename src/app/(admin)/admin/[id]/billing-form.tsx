"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { OrganizationFormState } from "@/server/actions/organizations";

export function BillingForm({
  action,
  paidUntil,
}: {
  action: (
    state: OrganizationFormState,
    formData: FormData,
  ) => Promise<OrganizationFormState>;
  paidUntil: string;
}) {
  const [state, formAction, pending] = useActionState<
    OrganizationFormState,
    FormData
  >(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="paidUntil">Pagado hasta (inclusive)</FieldLabel>
          <Input
            id="paidUntil"
            name="paidUntil"
            type="date"
            defaultValue={paidUntil}
          />
          <FieldDescription>
            Fecha del último día cubierto por el cobro B2B. Déjala vacía para
            borrar el registro. No cambia el estado de acceso.
          </FieldDescription>
        </Field>
      </FieldGroup>
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertDescription>Fecha de pago actualizada.</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Save data-icon="inline-start" />
        )}
        {pending ? "Guardando…" : "Guardar fecha"}
      </Button>
    </form>
  );
}
