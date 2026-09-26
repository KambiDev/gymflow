import React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Módulo de Cobranza Rápida
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Registra pagos de membresía y extiende vencimientos automáticamente
        </p>

        <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
          <CreditCard className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Flujo de Cobro</p>
          <p className="text-xs text-slate-400 mt-1">
            Seleccionar cliente ➔ Elegir plan ➔ Método
            (Efectivo/Transferencia/Tarjeta) ➔ Confirmar y calcular nuevo
            vencimiento.
          </p>
        </div>
      </div>
    </div>
  );
}
