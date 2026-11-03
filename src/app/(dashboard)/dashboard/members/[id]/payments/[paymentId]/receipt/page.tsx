import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgSession } from "@/lib/session";
import { findPaymentReceiptForOrg } from "@/server/payments/repository";

import { PrintButton } from "./print-button";

export const instant = false;
export const metadata: Metadata = { title: "Comprobante de cobro" };

const dateTimeFormat = new Intl.DateTimeFormat("es-NI", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Managua",
});
const currency = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
});
const methodNames: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  const session = await requireOrgSession();
  const { id, paymentId } = await params;
  const payment = await findPaymentReceiptForOrg(
    session.user.organizationId,
    id,
    paymentId,
  );
  if (!payment) notFound();

  return (
    <main className="payment-receipt mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6 print:min-h-0 print:max-w-none print:bg-white print:p-0 print:text-black">
      <nav
        aria-label="Acciones del comprobante"
        className="flex flex-wrap items-center gap-3 print:hidden"
      >
        <Link
          href={`/dashboard/members/${id}/payments`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← Volver a los cobros
        </Link>
        <PrintButton />
      </nav>
      <Card className="print:border-black print:bg-white print:text-black print:shadow-none">
        <CardHeader>
          <CardDescription className="print:text-black">
            {session.user.organizationName}
          </CardDescription>
          <CardTitle className="text-2xl">Comprobante de cobro</CardTitle>
          <p className="break-all text-xs text-muted-foreground print:text-black">
            Referencia: {payment.id}
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground print:text-black">Socio</dt>
              <dd className="font-medium">
                {payment.member.firstName} {payment.member.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground print:text-black">
                Fecha y hora del cobro (Nicaragua)
              </dt>
              <dd className="font-medium">
                {dateTimeFormat.format(payment.paidAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground print:text-black">
                Monto recibido
              </dt>
              <dd className="text-xl font-bold tabular-nums">
                {currency.format(Number(payment.amount.toFixed(2)))}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground print:text-black">
                Método de pago
              </dt>
              <dd className="font-medium">
                {methodNames[payment.method] ?? payment.method}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground print:text-black">
                Inicio del período cubierto
              </dt>
              <dd className="font-medium">
                {dateTimeFormat.format(payment.periodStart)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground print:text-black">
                Fin del período cubierto (no incluido)
              </dt>
              <dd className="font-medium">
                {dateTimeFormat.format(payment.periodEnd)}
              </dd>
            </div>
          </dl>
          <p className="mt-8 text-xs text-muted-foreground print:text-black">
            Constancia del cobro registrado en GymFlow. No es factura fiscal ni
            indica pagos posteriores.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
