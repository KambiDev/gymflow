import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('gymflow_user');
    const savedTenant = localStorage.getItem('gymflow_tenant');
    const token = localStorage.getItem('gymflow_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedTenant) setTenant(JSON.parse(savedTenant));
      } catch (e) {
        console.error('Error restaurando sesión:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('gymflow_token', data.token);
    localStorage.setItem('gymflow_user', JSON.stringify(data.user));
    setUser(data.user);

    if (data.tenant) {
      localStorage.setItem('gymflow_tenant', JSON.stringify(data.tenant));
      setTenant(data.tenant);
    } else {
      localStorage.removeItem('gymflow_tenant');
      setTenant(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('gymflow_token');
    localStorage.removeItem('gymflow_user');
    localStorage.removeItem('gymflow_tenant');
    setUser(null);
    setTenant(null);
    window.location.href = '/login';
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isReception = user?.role === 'reception';

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout, isSuperAdmin, isAdmin, isReception }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
