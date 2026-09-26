import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  CreditCard,
  LayoutDashboard,
  Settings,
  BarChart3,
  Building2,
} from "lucide-react";

export default function MobileNav() {
  const { isSuperAdmin, isAdmin } = useAuth();

  const navClass = ({ isActive }) =>
    `flex flex-col items-center justify-center py-2 px-3 text-xs font-medium transition-colors ${
      isActive
        ? "text-indigo-600 font-semibold"
        : "text-slate-500 hover:text-slate-900"
    }`;

  if (isSuperAdmin) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around items-center sm:hidden">
        <NavLink to="/superadmin/dashboard" className={navClass}>
          <LayoutDashboard className="w-5 h-5 mb-1" />
          Métricas
        </NavLink>
        <NavLink to="/superadmin/gyms" className={navClass}>
          <Building2 className="w-5 h-5 mb-1" />
          Gimnasios
        </NavLink>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around items-center sm:hidden">
      <NavLink to="/gym/dashboard" className={navClass}>
        <LayoutDashboard className="w-5 h-5 mb-1" />
        Inicio
      </NavLink>
      <NavLink to="/gym/clients" className={navClass}>
        <Users className="w-5 h-5 mb-1" />
        Clientes
      </NavLink>
      <NavLink to="/gym/payments" className={navClass}>
        <CreditCard className="w-5 h-5 mb-1" />
        Cobrar
      </NavLink>
      {isAdmin && (
        <>
          <NavLink to="/gym/reports" className={navClass}>
            <BarChart3 className="w-5 h-5 mb-1" />
            Reportes
          </NavLink>
          <NavLink to="/gym/plans" className={navClass}>
            <Settings className="w-5 h-5 mb-1" />
            Planes
          </NavLink>
        </>
      )}
    </nav>
  );
}
