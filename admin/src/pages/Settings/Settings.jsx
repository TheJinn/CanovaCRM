import React, { useEffect, useState } from 'react';
import styles from './Settings.module.css';
import api from '../../lib/api.js';

function Breadcrumbs() {
  return (
    <div className={styles.breadcrumbs}>
      <span className={styles.bcMuted}>Home</span>
      <span className={styles.bcSep}>&gt;</span>
      <span className={styles.bcBold}>Settings</span>
    </div>
  );
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirmPassword:'' });

  useEffect(() => {
    api.get('/api/admin/me').then(({ data }) => {
      setForm({ firstName: data.user.firstName, lastName: data.user.lastName, email: data.user.email, password:'', confirmPassword:'' });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaved('');
    setErr('');
    if (saving) return;
    const pass = form.password.trim();
    const conf = form.confirmPassword.trim();

    if (pass) {
      if (!conf) {
        setErr('Please confirm your password');
        return;
      }
      if (pass !== conf) {
        setErr('Password and confirm password do not match');
        return;
      }
    }

    try{
      setSaving(true);
      const payload = { firstName: form.firstName, lastName: form.lastName };
      if (pass) payload.password = pass;
      await api.put('/api/admin/me', payload);
      setSaved('Saved');
      setForm(f => ({ ...f, password:'', confirmPassword:'' }));
    }catch(e){
      setErr(e?.response?.data?.message || 'Failed');
    }finally{
      setSaving(false);
    }
  };

  if (loading) return null;

  const pass = form.password.trim();
  const conf = form.confirmPassword.trim();
  const mismatch = pass && conf && pass !== conf;

  return (
    <div className={styles.page}>

      <div className={styles.topRow}>
        <Breadcrumbs />
      </div>

      <div className={styles.card}>
        <div className={styles.tabHeader}>
          <div className={styles.tabActive}>Edit Profile</div>
          <div className={styles.tabSpacer} />
        </div>

        <div className={styles.formCol}>
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
        </div>

        {saved ? <div className={styles.saved}>{saved}</div> : null}
        {err ? <div className={styles.err}>{err}</div> : null}

        <div className={styles.actions}>
          <button className={styles.primary} onClick={save} disabled={saving || mismatch}>Save</button>
        </div>
      </div>
    </div>
  );
}
