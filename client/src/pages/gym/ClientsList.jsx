import React, { useState } from 'react';
import { Search, UserPlus, Phone, Calendar } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

export default function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestión de Clientes</h2>
          <p className="text-sm text-slate-500">Busca por nombre o teléfono</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs cursor-pointer">
          <UserPlus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador táctil y amigable para celular */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o número de teléfono..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center text-slate-500">
        <p className="text-sm">Listo para que DeepSeek conecte la lista y modales de clientes.</p>
      </div>
    </div>
  );
}
