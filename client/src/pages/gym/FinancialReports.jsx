import React from 'react';
import { BarChart3, DollarSign, Wallet } from 'lucide-react';

export default function FinancialReports() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Reportes Financieros</h2>
        <p className="text-sm text-slate-500">Ingresos del gimnasio y métodos de pago</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Efectivo</span>
          <p className="text-2xl font-bold text-slate-900 my-1">$ --</p>
          <span className="text-xs text-slate-400">Total cobrado en mano</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Transferencias</span>
          <p className="text-2xl font-bold text-slate-900 my-1">$ --</p>
          <span className="text-xs text-slate-400">Banco / billeteras digitales</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tarjetas</span>
          <p className="text-2xl font-bold text-slate-900 my-1">$ --</p>
          <span className="text-xs text-slate-400">POS / Débito / Crédito</span>
        </div>
      </div>
    </div>
  );
}
