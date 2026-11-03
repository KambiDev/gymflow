import { requireOrgAdmin } from "@/lib/session";
import { csvDownload } from "@/server/csv";
import { dueDateWindow } from "@/server/dues/dates";
import { memberRosterCsv } from "@/server/members/roster-csv";

export async function GET() {
  const session = await requireOrgAdmin();
  const day = dueDateWindow(new Date()).today.toISOString().slice(0, 10);
  return csvDownload(
    memberRosterCsv(session.user.organizationId),
    `socios-${day}.csv`,
  );
}
