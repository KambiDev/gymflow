import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout
import Navbar from "./components/layout/Navbar";
import MobileNav from "./components/layout/MobileNav";

// Páginas de Autenticación
import Login from "./pages/auth/Login";
import RegisterGym from "./pages/auth/RegisterGym";

// Páginas de Super Admin
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import GymsList from "./pages/superadmin/GymsList";

// Páginas de Gimnasio
import GymDashboard from "./pages/gym/GymDashboard";
import ClientsList from "./pages/gym/ClientsList";
import PaymentsPage from "./pages/gym/PaymentsPage";
import PlansSettings from "./pages/gym/PlansSettings";
import FinancialReports from "./pages/gym/FinancialReports";

function ProtectedLayout({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Cargando GymFlow...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={
          user.role === "super_admin"
            ? "/superadmin/dashboard"
            : "/gym/dashboard"
        }
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16 sm:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterGym />} />

          {/* Rutas Super Admin */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedLayout allowedRoles={["super_admin"]}>
                <SuperAdminDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/superadmin/gyms"
            element={
              <ProtectedLayout allowedRoles={["super_admin"]}>
                <GymsList />
              </ProtectedLayout>
            }
          />

          {/* Rutas Gimnasio */}
          <Route
            path="/gym/dashboard"
            element={
              <ProtectedLayout allowedRoles={["admin", "reception"]}>
                <GymDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/gym/clients"
            element={
              <ProtectedLayout allowedRoles={["admin", "reception"]}>
                <ClientsList />
              </ProtectedLayout>
            }
          />
          <Route
            path="/gym/payments"
            element={
              <ProtectedLayout allowedRoles={["admin", "reception"]}>
                <PaymentsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/gym/plans"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <PlansSettings />
              </ProtectedLayout>
            }
          />
          <Route
            path="/gym/reports"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <FinancialReports />
              </ProtectedLayout>
            }
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
