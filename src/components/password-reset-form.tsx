"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

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
import type { PasswordResetState } from "@/server/actions/password-reset";

export function PasswordResetForm({
  action,
}: {
  action: (
    state: PasswordResetState,
    formData: FormData,
  ) => Promise<PasswordResetState>;
}) {
  const [state, formAction, pending] = useActionState<
    PasswordResetState,
    FormData
  >(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="reset-new-password">Nueva contraseña</FieldLabel>
          <Input
            id="reset-new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <FieldDescription>
            Mínimo 12 caracteres. Entrégala a esta persona por un canal privado;
            no se mostrará después.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="reset-confirm-password">
            Repite la contraseña
          </FieldLabel>
          <Input
            id="reset-confirm-password"
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
      {state.success ? (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertDescription>
            Contraseña restablecida. Las sesiones anteriores ya no tienen
            acceso. Entrega la nueva contraseña por un canal privado.
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <KeyRound data-icon="inline-start" />
        )}
        {pending ? "Guardando…" : "Restablecer contraseña"}
      </Button>
    </form>
  );
}
