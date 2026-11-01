"use client";

import { useActionState } from "react";
import { AlertCircle, Building2 } from "lucide-react";

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
  registerOrganization,
  type OrganizationFormState,
} from "@/server/actions/organizations";

export function OrganizationForm() {
  const [state, formAction, pending] = useActionState<
    OrganizationFormState,
    FormData
  >(registerOrganization, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nombre del gimnasio</FieldLabel>
          <Input id="name" name="name" maxLength={100} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="contactName">
            Nombre del administrador
          </FieldLabel>
          <Input
            id="contactName"
            name="contactName"
            autoComplete="name"
            maxLength={100}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="contactEmail">Correo de acceso</FieldLabel>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="contactPhone">Teléfono (opcional)</FieldLabel>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="adminPassword">
            Contraseña inicial del administrador
          </FieldLabel>
          <Input
            id="adminPassword"
            name="adminPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <FieldDescription>
            Mínimo 12 caracteres. Entrégala al gimnasio por un canal privado;
            GymFlow no la mostrará después.
          </FieldDescription>
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
          <Building2 data-icon="inline-start" />
        )}
        {pending ? "Registrando…" : "Registrar gimnasio"}
      </Button>
    </form>
  );
}
