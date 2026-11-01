"use client";

import { useActionState } from "react";
import { AlertCircle, Banknote } from "lucide-react";

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
import type { PaymentFormState } from "@/server/actions/payments";

export function PaymentForm({
  action,
  suggestedAmount,
}: {
  action: (
    state: PaymentFormState,
    formData: FormData,
  ) => Promise<PaymentFormState>;
  suggestedAmount: string;
}) {
  const [state, formAction, pending] = useActionState<
    PaymentFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="amount">Monto cobrado (C$)</FieldLabel>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            max="99999999.99"
            step="0.01"
            defaultValue={suggestedAmount}
            required
          />
          <FieldDescription>
            Precio sugerido del plan; puedes ajustar el monto efectivamente
            recibido.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="method">Método de pago</FieldLabel>
          <NativeSelect
            id="method"
            name="method"
            className="w-full"
            defaultValue="cash"
          >
            <NativeSelectOption value="cash">Efectivo</NativeSelectOption>
            <NativeSelectOption value="transfer">
              Transferencia
            </NativeSelectOption>
            <NativeSelectOption value="card">Tarjeta</NativeSelectOption>
            <NativeSelectOption value="other">Otro</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="notes">Notas (opcional)</FieldLabel>
          <Textarea id="notes" name="notes" maxLength={1000} rows={2} />
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
          <Banknote data-icon="inline-start" />
        )}
        {pending ? "Registrando…" : "Registrar cobro"}
      </Button>
    </form>
  );
}
