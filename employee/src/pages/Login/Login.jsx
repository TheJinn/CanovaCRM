import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import api from '../../lib/api.js';
import { setToken } from '../../lib/auth.js';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try{
      const { data } = await api.post('/api/auth/employee/login', { email, password });
      setToken(data.token);
      nav('/app/home', { replace: true });
    }catch(e2){
      setErr(e2?.response?.data?.message || 'Login failed');
    }
  };

  const filled = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.brand}>
          <span className={styles.c}>Canova</span><span className={styles.crm}>CRM</span>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <input
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email"
            autoComplete="username"
          />
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
          />

          {err ? <div className={styles.err}>{err}</div> : null}

          <button className={`${styles.btn} ${filled ? styles.btnActive : ''}`} type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
