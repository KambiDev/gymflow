"use client";

import { useActionState } from "react";
import { AlertCircle, Save } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { MemberFormState } from "@/server/actions/members";

type InitialMember = {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  planId: string | null;
  notes: string | null;
};

type MemberFormProps = {
  plans: { id: string; name: string; active: boolean }[];
  initial?: InitialMember;
  action: (
    state: MemberFormState,
    formData: FormData,
  ) => Promise<MemberFormState>;
  submitLabel: string;
};

export function MemberForm({
  plans,
  initial,
  action,
  submitLabel,
}: MemberFormProps) {
  const [state, formAction, pending] = useActionState<
    MemberFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              defaultValue={initial?.firstName}
              maxLength={80}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              defaultValue={initial?.lastName}
              maxLength={80}
              required
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={initial?.phone ?? ""}
              maxLength={30}
              placeholder="+505 8888 8888"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Correo (opcional)</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={initial?.email ?? ""}
              maxLength={254}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="planId">Plan</FieldLabel>
          <NativeSelect
            id="planId"
            name="planId"
            className="w-full"
            defaultValue={initial?.planId ?? ""}
          >
            <NativeSelectOption value="">Sin plan asignado</NativeSelectOption>
            {plans.map((plan) => (
              <NativeSelectOption key={plan.id} value={plan.id}>
                {plan.name}
                {plan.active ? "" : " (desactivado)"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            La próxima fecha de pago se calcula al registrar un cobro; cambiar
            el plan no modifica los períodos ya cobrados.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="notes">Notas (opcional)</FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={1000}
            defaultValue={initial?.notes ?? ""}
          />
        </Field>
      </FieldGroup>

      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Save data-icon="inline-start" />
        )}
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
