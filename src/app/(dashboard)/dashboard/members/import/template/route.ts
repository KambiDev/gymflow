import { requireOrgAdmin } from "@/lib/session";
import { memberImportTemplate } from "@/server/members/import-template";

export async function GET() {
  await requireOrgAdmin();
  return memberImportTemplate();
}
