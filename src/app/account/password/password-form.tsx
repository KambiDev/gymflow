"use client";

import { useActionState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";

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
import {
  changePassword,
  type PasswordFormState,
} from "@/server/actions/account";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordFormState, FormData>(
    changePassword,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current-password">Contraseña actual</FieldLabel>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <FieldDescription>
            Usa al menos 12 caracteres. No repitas la contraseña actual.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">
            Repite la nueva contraseña
          </FieldLabel>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
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
          <KeyRound data-icon="inline-start" />
        )}
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
