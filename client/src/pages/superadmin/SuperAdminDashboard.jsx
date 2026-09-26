import React from 'react';
import { Building2, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Panel Global SaaS (Super Admin)</h2>
        <p className="text-sm text-slate-500">Métricas agregadas y facturación de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Gimnasios Activos</span>
          <p className="text-2xl font-bold text-slate-900 my-1">--</p>
          <span className="text-xs text-emerald-600 font-medium">Suscripción al día</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">En Trial (7 días)</span>
          <p className="text-2xl font-bold text-slate-900 my-1">--</p>
          <span className="text-xs text-blue-600 font-medium">Nuevos registros</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Suspendidos</span>
          <p className="text-2xl font-bold text-slate-900 my-1">--</p>
          <span className="text-xs text-rose-600 font-medium">Sin pago / Vencidos</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Recaudación Mes</span>
          <p className="text-2xl font-bold text-slate-900 my-1">$ --</p>
          <span className="text-xs text-indigo-600 font-medium">Efectivo / Transferencias</span>
        </div>
      </div>
    </div>
  );
}
