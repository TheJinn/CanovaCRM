import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AppHeader.module.css';

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppHeader({ title, showBack = false, onBack, children }) {
  const nav = useNavigate();
  const goBack = () => {
    if (onBack) return onBack();
    nav('/app/home');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}>
        <div className={styles.brandRow}>
          <div className={styles.brand} aria-label="CanovaCRM">
            <span className={styles.brandCanova}>Canova</span>
            <span className={styles.brandCRM}>CRM</span>
          </div>
        </div>

        {title ? (
          <div className={styles.titleRow}>
            {showBack ? (
              <button className={styles.backBtn} onClick={goBack} aria-label="Back">
                <BackIcon />
              </button>
            ) : null}
            <div className={styles.title}>{title}</div>
          </div>
        ) : null}

        {children ? <div className={styles.children}>{children}</div> : null}
      </div>
    </div>
  );
}
