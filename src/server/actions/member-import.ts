"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { requireOrgAdmin } from "@/lib/session";
import {
  maxImportBytes,
  MemberImportError,
  parseMemberImportCsv,
} from "@/server/members/import-csv";
import {
  importMembersForOrg,
  previewMembersForOrg,
} from "@/server/members/repository";

export type MemberImportState = {
  error?: string;
  imported?: number;
  preview?: { members: number; withPlan: number };
};

export async function importMembers(
  _state: MemberImportState,
  formData: FormData,
): Promise<MemberImportState> {
  const session = await requireOrgAdmin();
  const intent = formData.get("intent");
  if (intent !== "preview" && intent !== "import")
    return { error: "Elige revisar o importar el archivo." };
  const files = formData.getAll("file");
  const file = files.length === 1 ? files[0] : null;
  if (
    !(file instanceof File) ||
    !file.name.toLowerCase().endsWith(".csv") ||
    file.size === 0
  )
    return { error: "Selecciona un archivo CSV válido." };
  if (file.size > maxImportBytes)
    return { error: "El archivo supera los 256 KB permitidos." };
  if (intent === "import" && formData.get("confirm") !== "yes")
    return { error: "Confirma que verificaste los datos antes de importar." };

  let members;
  try {
    const contents = new TextDecoder("utf-8", { fatal: true }).decode(
      await file.arrayBuffer(),
    );
    members = parseMemberImportCsv(contents);
  } catch (error) {
    if (error instanceof MemberImportError) return { error: error.message };
    if (error instanceof TypeError)
      return { error: "El archivo debe estar codificado en UTF-8." };
    throw error;
  }

  try {
    if (intent === "preview") {
      const result = await previewMembersForOrg(
        session.user.organizationId,
        members,
      );
      if (result.duplicateEmail)
        return {
          error:
            "Ya existe un socio con uno de esos correos en este gimnasio. No se importó ninguna fila.",
        };
      return {
        preview: { members: result.members, withPlan: result.withPlan },
      };
    }
    const result = await importMembersForOrg(
      session.user.organizationId,
      members,
    );
    if (result.duplicateEmail)
      return {
        error:
          "Ya existe un socio con uno de esos correos en este gimnasio. No se importó ninguna fila.",
      };
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/alerts");
    return { imported: result.imported };
  } catch (error) {
    if (error instanceof MemberImportError) return { error: error.message };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        error:
          "Otra operación modificó los socios al mismo tiempo. Revisa el padrón y vuelve a intentarlo.",
      };
    }
    throw error;
  }
}
