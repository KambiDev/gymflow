"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

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
import { registerStaff, type StaffFormState } from "@/server/actions/staff";

export function StaffForm() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(
    registerStaff,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="staff-name">Nombre</FieldLabel>
          <Input
            id="staff-name"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="staff-email">Correo de acceso</FieldLabel>
          <Input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="staff-password">Contraseña inicial</FieldLabel>
          <Input
            id="staff-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <FieldDescription>
            Mínimo 12 caracteres. Compártela por un canal privado; no se
            mostrará después.
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
          <AlertDescription>
            Cuenta creada. Entrega la contraseña por un canal privado.
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <UserPlus data-icon="inline-start" />
        )}
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
