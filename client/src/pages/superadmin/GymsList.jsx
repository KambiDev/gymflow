import React from "react";
import { Building2, Plus, CreditCard, Ban, CheckCircle } from "lucide-react";

export default function GymsList() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Gimnasios Registrados
          </h2>
          <p className="text-sm text-slate-500">
            Gestión de suscripciones y altas manuales
          </p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs cursor-pointer">
          <Plus className="w-4 h-4" />
          Alta de Gym en Persona (Efectivo)
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center text-slate-500">
        <p className="text-sm">
          Tabla de gimnasios con botón para registrar pago manual del SaaS listo
          para que DeepSeek lo conecte.
        </p>
      </div>
    </div>
  );
}
