import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Leads.module.css';
import api from '../../lib/api.js';

const LANGS = ['Marathi', 'Kannada', 'Hindi', 'English', 'Bengali'];
const PAGE_SIZE = 8;

function Breadcrumbs() {
  return (
    <div className={styles.breadcrumbs}>
      <span className={styles.bcMuted}>Home</span>
      <span className={styles.bcSep}>&gt;</span>
      <span className={styles.bcBold}>Leads</span>
    </div>
  );
}

function TopSearch({ value, onChange }) {
  return (
    <div className={styles.headerBar}>
      <div className={styles.searchWrap}>
        <div className={styles.searchIcon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="#5B5B5B" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="#5B5B5B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <input
          className={styles.search}
          placeholder="Search here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPrev, onNext, onPage }) {
  const items = useMemo(() => {
    if (totalPages <= 1) return [1];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    // Design-style: 1 2 3 ... (last-2) (last-1) last
    const last = totalPages;
    const base = [1, 2, 3, '…', last - 2, last - 1, last];
    // If current page is in the middle, replace the middle part for better UX
    if (page > 3 && page < last - 2) {
      return [1, '…', page - 1, page, page + 1, '…', last];
    }
    // If near the end, show last pages
    if (page >= last - 2) {
      return [1, 2, '…', last - 3, last - 2, last - 1, last].filter((v, i, arr) => !(v === '…' && arr[i - 1] === '…'));
    }
    return base;
  }, [page, totalPages]);

  return (
    <div className={styles.pagerRow}>
      <button className={styles.pPrev} onClick={onPrev} disabled={page <= 1}>
        <span className={styles.pArrow} aria-hidden="true">←</span>
        Previous
      </button>

      <div className={styles.pNums}>
        {items.map((it, idx) => {
          if (it === '…') return <span key={`e-${idx}`} className={styles.ellipsis}>…</span>;
          const p = it;
          return (
            <button
              key={p}
              className={p === page ? styles.pNumActive : styles.pNum}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button className={styles.pNext} onClick={onNext} disabled={page >= totalPages}>
        Next
        <span className={styles.pArrow} aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, width = 720 }) {
  return (
    <div className={styles.modalBack} onMouseDown={onClose}>
      <div className={styles.modal} style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalTop}>
          <div>
            <div className={styles.modalTitle}>{title}</div>
            {subtitle ? <div className={styles.modalSub}>{subtitle}</div> : null}
          </div>
          <button className={styles.x} onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', source: '', date: '', location: '', language: LANGS[0] });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setErr('');
    setSaving(true);
    try {
      const payload = {
        name: (form.name || '').trim(),
        email: (form.email || '').trim(),
        source: (form.source || '').trim(),
        date: (form.date || '').trim(),
        location: (form.location || '').trim(),
        language: (form.language || '').trim(),
      };
      await api.post('/api/admin/leads/manual', payload);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add New Lead" onClose={onClose} width={620}>
      <div className={styles.formCol}>
        <div className={styles.field}>
          <div className={styles.label}>Name</div>
          <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Email</div>
          <input className={styles.input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Source</div>
          <input className={styles.input} value={form.source} onChange={(e) => set('source', e.target.value)} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Date</div>
          <input className={styles.input} value={form.date} onChange={(e) => set('date', e.target.value)} placeholder="DD-MM-YYYY" />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Location</div>
          <input className={styles.input} value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Preferred Language</div>
          <select className={styles.input} value={form.language} onChange={(e) => set('language', e.target.value)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {err ? <div className={styles.err}>{err}</div> : null}
      </div>

      <div className={styles.saveWrap}>
        <button className={styles.saveBtn} onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

function UploadIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2_5906)">
      <path d="M33.4418 3.12109H14.1744V11.1111H37.5569V7.23451C37.5569 4.96616 35.7108 3.12109 33.4418 3.12109Z" fill="#00181B" fill-opacity="0.25"/>
      <path d="M22.5352 12.3403H0V4.92636C0 2.20972 2.21068 0 4.92828 0H12.1336C12.8497 0 13.5396 0.150925 14.1664 0.434509C15.0418 0.828964 15.7939 1.47913 16.3213 2.3286L22.5352 12.3403Z" fill="#00181B"/>
      <path d="M42 14.0004V37.8817C42 40.153 40.1511 42.0003 37.8789 42.0003H4.12111C1.84891 42.0003 0 40.153 0 37.8817V9.88086H37.8789C40.1511 9.88086 42 11.7288 42 14.0004Z" fill="#00181B"/>
      <path d="M42 14.0004V37.8817C42 40.153 40.1511 42.0003 37.8789 42.0003H21V9.88086H37.8789C40.1511 9.88086 42 11.7288 42 14.0004Z" fill="#00181B"/>
      <path d="M32.0479 25.9395C32.0479 32.032 27.0918 36.9884 21 36.9884C14.9082 36.9884 9.95206 32.032 9.95206 25.9395C9.95206 19.8481 14.9082 14.8916 21 14.8916C27.0918 14.8916 32.0479 19.8481 32.0479 25.9395Z" fill="white"/>
      <path d="M32.0479 25.9395C32.0479 32.032 27.0918 36.9884 21 36.9884V14.8916C27.0918 14.8916 32.0479 19.8481 32.0479 25.9395Z" fill="#00181B" fill-opacity="0.25"/>
      <path d="M24.561 26.0758C24.3306 26.2709 24.0483 26.3661 23.7686 26.3661C23.4183 26.3661 23.0703 26.2177 22.8268 25.9287L22.2305 25.2218V29.8499C22.2305 30.5292 21.6793 31.0803 21 31.0803C20.3207 31.0803 19.7695 30.5292 19.7695 29.8499V25.2218L19.1732 25.9287C18.7342 26.4481 17.9584 26.5145 17.439 26.0758C16.9199 25.6378 16.8533 24.8617 17.2913 24.3422L19.7269 21.4548C20.0445 21.0793 20.5078 20.8633 21 20.8633C21.4922 20.8633 21.9555 21.0793 22.2731 21.4548L24.7087 24.3422C25.1467 24.8617 25.0801 25.6378 24.561 26.0758Z" fill="#00181B"/>
      <path d="M24.561 26.0758C24.3306 26.2709 24.0483 26.3661 23.7686 26.3661C23.4183 26.3661 23.0703 26.2177 22.8268 25.9287L22.2305 25.2218V29.8499C22.2305 30.5292 21.6793 31.0803 21 31.0803V20.8633C21.4922 20.8633 21.9555 21.0793 22.2731 21.4548L24.7087 24.3422C25.1467 24.8617 25.0801 25.6378 24.561 26.0758Z" fill="#00181B"/>
      </g>
      <defs>
      <clipPath id="clip0_2_5906">
      <rect width="42" height="42" fill="white"/>
      </clipPath>
      </defs>
    </svg>
  );
}

function ProgressRing({ percent }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <div className={styles.ringWrap}>
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} stroke="rgba(0,0,0,0.12)" strokeWidth="4" fill="none" />
        <circle
          cx="21"
          cy="21"
          r={r}
          stroke="#0F172A"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 21 21)"
        />
      </svg>
      <div className={styles.ringText}>{percent}%</div>
    </div>
  );
}

function CsvUploadModal({ onClose, onSaved }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('select'); // select | verifying | ready | uploading
  const [percent, setPercent] = useState(0);
  const [msg, setMsg] = useState('');

  const pick = () => inputRef.current?.click();

  const reset = () => {
    setFile(null);
    setStep('select');
    setPercent(0);
    setMsg('');
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const next = () => {
    if (!file) return;
    setStep('verifying');
    setPercent(0);
    setMsg('');
    const start = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 900);
      setPercent(Math.round(t * 100));
      if (t >= 1) {
        clearInterval(timer);
        setStep('ready');
      }
    }, 30);
  };

  const upload = async () => {
    if (!file) return;
    setStep('uploading');
    setPercent(0);
    setMsg('');
    // smooth fake progress while request is in flight
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(95, p + Math.floor(Math.random() * 7) + 2);
      setPercent(p);
    }, 120);

    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/api/admin/leads/upload-csv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPercent(100);
      setMsg(`Inserted ${data.inserted}, Assigned ${data.assigned}`);
      onSaved();
      // close quickly (design has no success screen)
      setTimeout(() => onClose(), 600);
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Upload failed');
      setStep('ready');
    } finally {
      clearInterval(t);
    }
  };

  return (
    <Modal title="CSV Upload" subtitle="Add your documents here" onClose={onClose} width={720}>
      <div
        className={styles.drop}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {step === 'select' ? (
          <>
            <div className={styles.dropInner}>
              <UploadIcon />
              <div className={styles.dropText}>Drag your file(s) to start uploading</div>
              <div className={styles.or}>OR</div>
              <button className={styles.browse} onClick={pick}>Browse files</button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div className={styles.sampleRow}>
                <div className={styles.sampleName}>{file ? file.name : 'Sample File.csv'}</div>
                <a className={styles.sampleDl} href="/sample_leads.csv" download aria-label="Download sample">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3V14" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 10L12 14L16 10" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 20H19" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.dropInner}>
              <ProgressRing percent={percent} />
              <div className={styles.dropText}>{step === 'verifying' ? 'Verifying…' : step === 'uploading' ? 'Uploading…' : 'Ready to Upload'}</div>
              <button className={styles.cancelSmall} onClick={reset}>Cancel</button>
              {msg ? <div className={styles.msg}>{msg}</div> : null}
            </div>
          </>
        )}
      </div>

      <div className={styles.modalActionsCsv}>
        <button className={styles.csvCancel} onClick={onClose}>Cancel</button>
        {step === 'select' ? (
          <button className={styles.csvNext} onClick={next} disabled={!file}>Next <span aria-hidden="true">›</span></button>
        ) : (
          <button className={styles.csvUpload} onClick={upload} disabled={step !== 'ready'}>Upload</button>
        )}
      </div>
    </Modal>
  );
}

function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s);
}
function fmtDDMMYYYY(s) {
  if (!s) return '—';
  if (isISODate(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  // If already looks like dd/mm/yy etc, keep as-is
  return s;
}
function fmtScheduleDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = String(dt.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState({ items: [], totalPages: 1, total: 0, page: 1 });

  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);

  const reqRef = useRef(0);

  const load = async (p = page, q = search) => {
    const my = ++reqRef.current;
    const { data } = await api.get('/api/admin/leads', { params: { page: p, search: q } });
    if (my !== reqRef.current) return; // ignore stale responses
    setRes(data);
  };

  useEffect(() => {
    load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, search);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    load(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const rows = useMemo(() => res.items || [], [res]);

  return (
    <div className={styles.page}>
      <TopSearch value={search} onChange={setSearch} />

      <div className={styles.topRow}>
        <Breadcrumbs />
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => setShowAdd(true)}>Add Manually</button>
          <button className={styles.actionBtn} onClick={() => setShowCsv(true)}>Add CSV</button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <div>No.</div>
          <div>Name</div>
          <div>Email</div>
          <div>Source</div>
          <div>Date</div>
          <div>Location</div>
          <div>Language</div>
          <div>Assigned To</div>
          <div>Status</div>
          <div>Type</div>
          <div>Scheduled Date</div>
        </div>

        <div className={styles.tableBody}>
          {rows.map((l, idx) => {
            const no = (Number(res.page || page) - 1) * PAGE_SIZE + idx + 1;
            return (
              <div className={styles.row} key={l.id}>
                <div className={styles.cellNo}>{no}</div>
                <div className={styles.cellStrong}>{l.name}</div>
                <div className={styles.cellMuted}>{l.email}</div>
                <div className={styles.cell}>{l.source || '—'}</div>
                <div className={styles.cell}>{fmtDDMMYYYY(l.date)}</div>
                <div className={styles.cell}>{l.location || '—'}</div>
                <div className={styles.cell}>{l.language || '—'}</div>
                <div className={styles.cell}>{l.assignedTo?.employeeID || 'Unassigned'}</div>
                <div className={styles.cell}>
                  <span className={styles.statusPill}>{l.status}</span>
                </div>
                <div className={styles.cell}>{l.type}</div>
                <div className={styles.cell}>{l.scheduleDate ? fmtScheduleDate(l.scheduleDate) : '—'}</div>
              </div>
            );
          })}
        </div>

        <Pagination
          page={Number(res.page || page)}
          totalPages={Number(res.totalPages || 1)}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(Number(res.totalPages || 1), p + 1))}
          onPage={setPage}
        />
      </div>

      {showAdd ? (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onSaved={() => load(page, search)}
        />
      ) : null}

      {showCsv ? (
        <CsvUploadModal
          onClose={() => setShowCsv(false)}
          onSaved={() => load(page, search)}
        />
      ) : null}
    </div>
  );
}
