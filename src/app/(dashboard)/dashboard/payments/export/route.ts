import { requireOrgSession } from "@/lib/session";
import { paymentDayWindow } from "@/server/payments/daily-report";
import { dailyPaymentCsv } from "@/server/payments/daily-csv";

export async function GET(request: Request) {
  const session = await requireOrgSession();
  const dates = new URL(request.url).searchParams.getAll("date");
  const day = dates.length === 1 ? dates[0] : "";
  if (!paymentDayWindow(day)) {
    return new Response("Selecciona una fecha válida.", { status: 400 });
  }

  const rows = dailyPaymentCsv(session.user.organizationId, day);
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await rows.next();
        if (chunk.done) controller.close();
        else controller.enqueue(encoder.encode(chunk.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await rows.return();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cobros-${day}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
