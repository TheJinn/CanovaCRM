import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Leads from './pages/Leads/Leads.jsx';
import Employees from './pages/Employees/Employees.jsx';
import Settings from './pages/Settings/Settings.jsx';
import AdminLayout from './shared/AdminLayout/AdminLayout.jsx';
import { setToken } from './lib/auth.js';
import api from './lib/api.js';

function AdminNotFound() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', background: 'var(--page-bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 10 }}>admin not found</div>
      </div>
    </div>
  );
}

function AdminGate({ children }) {
  const [state, setState] = useState({ loading: true, notFound: false });

  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await api.get('/api/admin/bootstrap');
        if (data?.token) setToken(data.token);
        setState({ loading: false, notFound: false });
      } catch (e) {
        if (e?.response?.status === 404) {
          setState({ loading: false, notFound: true });
        } else {
          // for unexpected errors, retry by reloading
          setState({ loading: false, notFound: false });
        }
      }
    };
    boot();
  }, []);

  if (state.loading) return null;
  if (state.notFound) return <AdminNotFound />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <AdminGate>
            <AdminLayout />
          </AdminGate>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="employees" element={<Employees />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
