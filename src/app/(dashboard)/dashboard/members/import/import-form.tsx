"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, SearchCheck, Upload } from "lucide-react";

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
          <Checkbox id="confirm-import" name="confirm" value="yes" />
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
      {state.preview ? (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertDescription>
            Último archivo revisado: {state.preview.members} socios,{" "}
            {state.preview.withPlan} con plan. No se guardó ninguno. Confirma la
            importación si deseas continuar; el servidor volverá a revisar el
            archivo al hacerlo.
          </AlertDescription>
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
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          name="intent"
          value="preview"
          variant="outline"
          disabled={pending}
        >
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <SearchCheck data-icon="inline-start" />
          )}
          Revisar archivo
        </Button>
        <Button type="submit" name="intent" value="import" disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Upload data-icon="inline-start" />
          )}
          Importar socios
        </Button>
      </div>
    </form>
  );
}
