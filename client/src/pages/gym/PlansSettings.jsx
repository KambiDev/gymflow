import React from "react";
import { Plus, Tag } from "lucide-react";

export default function PlansSettings() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Planes de Membresía
          </h2>
          <p className="text-sm text-slate-500">
            Define los precios y duración de tus membresías
          </p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs cursor-pointer">
          <Plus className="w-4 h-4" />
          Crear Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Placeholder tarjeta de plan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-slate-900">Plan Mensual</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              30 días
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 my-2">$ 30.00</p>
          <p className="text-xs text-slate-400">
            Pase libre a todas las instalaciones
          </p>
        </div>
      </div>
    </div>
  );
}
