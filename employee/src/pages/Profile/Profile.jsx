import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';
import api from '../../lib/api.js';
import { clearToken } from '../../lib/auth.js';
import AppHeader from '../../shared/AppHeader/AppHeader.jsx';

export default function Profile() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirmPassword:'' });

  useEffect(() => {
    api.get('/api/employee/me').then(({ data }) => {
      const u = data.user;
      setForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        password: '',
        confirmPassword: '',
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setMsg('');
    setErr('');
    try{
      const payload = { firstName: form.firstName, lastName: form.lastName };
      const pass = form.password.trim();
      const conf = form.confirmPassword.trim();
      if (pass) {
        if (pass !== conf) {
          setErr('Passwords do not match');
          return;
        }
        payload.password = pass;
      }
      await api.put('/api/employee/me', payload);
      setMsg('Saved');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    }catch(e){
      setErr(e?.response?.data?.message || 'Failed');
    }
  };

  const logout = () => {
    clearToken();
    nav('/login', { replace: true });
  };

  if (loading) return null;

  const pass = form.password.trim();
  const conf = form.confirmPassword.trim();
  const mismatch = pass && conf && pass !== conf;

  return (
    <div className={styles.page}>
      <AppHeader title="Profile" showBack />

      <div className={styles.formWrap}>
        <div className={styles.field}>
          <div className={styles.label}>First name</div>
          <input className={styles.input} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Last name</div>
          <input className={styles.input} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Email</div>
          <input className={styles.input} value={form.email} disabled />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Password</div>
          <input className={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Confirm Password</div>
          <input className={styles.input} type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>

        {mismatch ? <div className={styles.err}>Passwords do not match</div> : null}

        {msg ? <div className={styles.saved}>{msg}</div> : null}
        {(!mismatch && err) ? <div className={styles.err}>{err}</div> : null}


        <div className={styles.actions}>
          <button className={styles.primary} onClick={save} disabled={mismatch}>Save</button>
          <button className={styles.logout} onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
