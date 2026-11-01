"use client";

import { useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createPlan, type PlanFormState } from "@/server/actions/plans";

export function PlanForm() {
  const [state, action, pending] = useActionState<PlanFormState, FormData>(
    createPlan,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nombre</FieldLabel>
          <Input id="name" name="name" placeholder="Ej. Mensual" minLength={2} maxLength={80} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="price">Precio (C$)</FieldLabel>
          <Input id="price" name="price" type="number" inputMode="decimal" min="0.01" max="99999999.99" step="0.01" placeholder="800.00" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="durationDays">Duración (días)</FieldLabel>
          <Input id="durationDays" name="durationDays" type="number" inputMode="numeric" min="1" max="3650" placeholder="30" required />
          <FieldDescription>Un mes típico equivale a 30 días.</FieldDescription>
        </Field>
      </FieldGroup>

      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? <p role="status" className="text-sm text-muted-foreground">Plan creado correctamente.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
        {pending ? "Guardando…" : "Crear plan"}
      </Button>
    </form>
  );
}
