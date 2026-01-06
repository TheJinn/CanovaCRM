import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminLayout.module.css';

function Logo() {
  return (
    <div className={styles.logo}>
      <span className={styles.logoCanova}>Canova</span>
      <span className={styles.logoCRM}>CRM</span>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Logo />
        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>Dashboard</NavLink>
          <NavLink to="/leads" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>Leads</NavLink>
          <NavLink to="/employees" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>Employees</NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? styles.navItemActive : styles.navItem}>Settings</NavLink>
        </nav>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
