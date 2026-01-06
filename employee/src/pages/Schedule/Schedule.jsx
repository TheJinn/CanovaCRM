import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './Schedule.module.css';
import api from '../../lib/api.js';
import AppHeader from '../../shared/AppHeader/AppHeader.jsx';

function isToday(dt) {
  if (!dt) return false;
  const d = new Date(dt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="#3b3b3b" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="#3b3b3b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h10" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6h2" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2" fill="#2b2b2b" />

      <path d="M4 12h2" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 12h10" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="12" r="2" fill="#2b2b2b" />

      <path d="M4 18h10" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 18h2" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="18" r="2" fill="#2b2b2b" />
    </svg>
  );
}

function PinIcon({ light = false }) {
  const stroke = light ? 'rgba(255,255,255,0.95)' : '#6f6f6f';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s7-4.5 7-12a7 7 0 1 0-14 0c0 7.5 7 12 7 12Z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function formatDMY(dt) {
  const d = new Date(dt);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function formatTime(dt) {
  const d = new Date(dt);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export default function Schedule() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const filterRef = useRef(null);
  const filterBtnRef = useRef(null);

  const load = async () => {
    const { data } = await api.get('/api/employee/leads', { params: { onlyScheduled: true } });
    setItems(Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(l => l.scheduleDate)
      .filter(l => !q || (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q))
      .filter(l => (filterValue === 'Today' ? isToday(l.scheduleDate) : true))
      .sort((a,b) => new Date(a.scheduleDate) - new Date(b.scheduleDate));
  }, [items, search, filterValue]);

  const openFilter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    // anchor near icon like design
    setFilterPos({
      left: r.left + r.width / 2,
      top: r.bottom + 8,
    });
    setShowFilter(true);
  };

  // close filter on outside click
  useEffect(() => {
    if (!showFilter) return;
    const onDown = (evt) => {
      const pop = filterRef.current;
      const btn = filterBtnRef.current;
      if (pop && pop.contains(evt.target)) return;
      if (btn && btn.contains(evt.target)) return;
      setShowFilter(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showFilter]);

  // keep popover inside phone
  useLayoutEffect(() => {
    if (!showFilter) return;
    const el = filterRef.current;
    if (!el) return;
    const phone = document.querySelector('[data-phone-shell]') || document.querySelector('.appShell') || document.body;
    const pr = phone.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    let left = filterPos.left - er.width / 2;
    let top = filterPos.top;
    const pad = 10;
    if (left < pr.left + pad) left = pr.left + pad;
    if (left + er.width > pr.right - pad) left = pr.right - pad - er.width;
    if (top + er.height > pr.bottom - pad) top = pr.bottom - pad - er.height;
    if (top < pr.top + pad) top = pr.top + pad;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [showFilter, filterPos]);

  return (
    <div className={styles.page}>
      <AppHeader title="Schedule" showBack />

      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input
            className={styles.search}
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          ref={filterBtnRef}
          className={styles.filterIconBtn}
          onClick={openFilter}
          aria-label="Filter"
        >
          <FilterIcon />
        </button>

        {showFilter ? (
          <div ref={filterRef} className={styles.filterPop}>
            <div className={styles.filterTitle}>Filter</div>
            <select
              className={styles.select}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            >
              <option value="Today">Today</option>
              <option value="All">All</option>
            </select>
            <button className={styles.saveBtn} onClick={() => setShowFilter(false)}>Save</button>
          </div>
        ) : null}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No scheduled leads.</div>
        ) : filtered.map((l, idx) => {
          const dateStr = formatDMY(l.scheduleDate);
          const timeStr = formatTime(l.scheduleDate);
          const active = idx === 0; // first highlighted like design screenshot
          return (
            <div className={`${styles.card} ${active ? styles.cardActive : ''}`} key={l._id}>
              <div className={styles.left}>
                <div className={styles.source}>{l.source || '—'}</div>
                <div className={styles.email}>{l.email || '—'}</div>
                <div className={styles.row2}>
                  <span className={styles.pin}><PinIcon light={active} /></span>
                  <span className={styles.callText}>Call</span>
                </div>
                <div className={styles.personRow}>
                  <div className={styles.avatar} aria-hidden="true" />
                  <div className={styles.name}>{l.name}</div>
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.rightBlock}>
                  <div className={styles.rightLabel}>Date</div>
                  <div className={styles.rightVal}>{dateStr}</div>
                </div>
                <div className={styles.rightBlock}>
                  <div className={styles.rightLabel}>Time</div>
                  <div className={styles.rightVal}>{timeStr}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
