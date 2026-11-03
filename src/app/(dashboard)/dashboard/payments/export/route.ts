import { requireOrgSession } from "@/lib/session";
import { csvDownload } from "@/server/csv";
import { paymentDayWindow } from "@/server/payments/daily-report";
import { dailyPaymentCsv } from "@/server/payments/daily-csv";

export async function GET(request: Request) {
  const session = await requireOrgSession();
  const dates = new URL(request.url).searchParams.getAll("date");
  const day = dates.length === 1 ? dates[0] : "";
  if (!paymentDayWindow(day)) {
    return new Response("Selecciona una fecha válida.", { status: 400 });
  }

  return csvDownload(
    dailyPaymentCsv(session.user.organizationId, day),
    `cobros-${day}.csv`,
  );
}
