import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from './pages/Login/Login.jsx';
import MobileLayout from './shared/MobileLayout/MobileLayout.jsx';
import Home from './pages/Home/Home.jsx';
import Leads from './pages/Leads/Leads.jsx';
import Schedule from './pages/Schedule/Schedule.jsx';
import Profile from './pages/Profile/Profile.jsx';
import { getToken } from './lib/auth.js';

function RequireAuth({ children }) {
  const loc = useLocation();
  const token = getToken();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Login should render inside the same mobile portrait shell */}
      <Route path="/login" element={<div className="appShell"><Login /></div>} />
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <MobileLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="leads" element={<Leads />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
