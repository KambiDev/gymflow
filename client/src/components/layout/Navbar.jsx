import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Dumbbell } from "lucide-react";

export default function Navbar() {
  const { user, tenant, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-2 rounded-lg">
          <Dumbbell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">
            GymFlow
          </h1>
          <p className="text-xs text-slate-500">
            {tenant?.name ||
              (user?.role === "super_admin" ? "Super Admin" : "Panel")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
          <p className="text-xs text-slate-400 capitalize">
            {user?.role?.replace("_", " ")}
          </p>
        </div>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
