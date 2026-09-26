import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Users, AlertTriangle, CreditCard, Clock } from "lucide-react";
import StatusBadge from "../../components/common/StatusBadge";

export default function GymDashboard() {
  const { tenant } = useAuth();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Saludo y estado del gym */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Panel Operativo</h2>
          <p className="text-sm text-slate-500">Gestión rápida del gimnasio</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Estado de cuenta SaaS:
          </span>
          <StatusBadge
            status={tenant?.status || "active"}
            label={tenant?.status?.toUpperCase()}
          />
        </div>
      </div>

      {/* Tarjetas de acceso rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Activos</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">--</p>
          <span className="text-xs text-slate-400">Al día</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Por Vencer</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">--</p>
          <span className="text-xs text-slate-400">Próximos 5 días</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Vencidos</span>
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600">--</p>
          <span className="text-xs text-slate-400">Cobro pendiente</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Caja Hoy</span>
            <CreditCard className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">$ --</p>
          <span className="text-xs text-slate-400">Total cobrado</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center py-12">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">
          Alertas de Vencimiento de Clientes
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Aquí se listarán automáticamente los clientes que vencen hoy o en los
          próximos días para contactarlos por WhatsApp con un solo clic.
        </p>
      </div>
    </div>
  );
}
