"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  importMembers,
  type MemberImportState,
} from "@/server/actions/member-import";

export function MemberImportForm() {
  const [state, action, pending] = useActionState<MemberImportState, FormData>(
    importMembers,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.imported) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="members-csv">Archivo CSV (UTF-8)</FieldLabel>
          <Input
            id="members-csv"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
          />
          <FieldDescription>
            Máximo 200 socios y 256 KB por archivo. Si una fila falla, no se
            guarda ninguna.
          </FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="confirm-import" name="confirm" value="yes" required />
          <FieldLabel htmlFor="confirm-import">
            Revisé que estos socios no estén registrados y acepto importar sus
            datos.
          </FieldLabel>
        </Field>
      </FieldGroup>
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.imported ? (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertDescription>
            Se importaron {state.imported} socios. Los planes indicados quedaron
            asignados sin registrar cobros; puedes revisar cada socio en su
            ficha.
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Upload data-icon="inline-start" />
        )}
        {pending ? "Importando…" : "Importar socios"}
      </Button>
    </form>
  );
}
