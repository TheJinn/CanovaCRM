import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Employees.module.css';
import api from '../../lib/api.js';

const LANGS = ['English', 'Hindi', 'Marathi', 'Kannada', 'Bengali'];
const PAGE_SIZE = 8;

function Breadcrumbs() {
  return (
    <div className={styles.breadcrumbs}>
      <span className={styles.bcMuted}>Home</span>
      <span className={styles.bcSep}>&gt;</span>
      <span className={styles.bcBold}>Employees</span>
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
  const pages = useMemo(() => {
    if (totalPages <= 1) return [1];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const last = totalPages;
    if (page > 3 && page < last - 2) return [1, '…', page - 1, page, page + 1, '…', last];
    if (page >= last - 2) return [1, 2, '…', last - 3, last - 2, last - 1, last];
    return [1, 2, 3, '…', last - 2, last - 1, last];
  }, [page, totalPages]);

  return (
    <div className={styles.pagerRow}>
      <button className={styles.pPrev} onClick={onPrev} disabled={page <= 1}>
        <span className={styles.pArrow} aria-hidden="true">←</span>
        Previous
      </button>
      <div className={styles.pNums}>
        {pages.map((p, idx) => {
          if (p === '…') return <span key={`e-${idx}`} className={styles.ellipsis}>…</span>;
          return (
            <button key={p} className={p === page ? styles.pNumActive : styles.pNum} onClick={() => onPage(p)}>
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

function InitialsAvatar({ firstName, lastName }) {
  const a = (firstName?.[0] || '').toUpperCase();
  const b = (lastName?.[0] || '').toUpperCase();
  return <div className={styles.avatar}>{a}{b}</div>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className={styles.modalBack} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalTop}>
          <div className={styles.modalTitle}>{title}</div>
          <button className={styles.x} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onCancel, onSubmit, submitLabel }) {
  const [form, setForm] = useState(initial);
  const [err, setErr] = useState('');
  const save = async () => {
    setErr('');
    try {
      await onSubmit(form);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed');
    }
  };
  return (
    <>
      <div className={styles.formCol}>
        <div className={styles.field}>
          <div className={styles.label}>First name</div>
          <input className={styles.input} value={form.firstName || ''} onChange={e => setForm({ ...form, firstName: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Last name</div>
          <input className={styles.input} value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Email</div>
          <input className={styles.input} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>Location</div>
          <input className={styles.input} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <div className={styles.label}>Preferred Language</div>
            <div className={styles.infoWrap}>
              <div className={styles.infoIcon} tabIndex={0} aria-label="Info">i</div>
              <div className={styles.tooltip}>Lead will be assigned on biases on language</div>
            </div>
          </div>
          <select className={styles.input} value={form.language || ''} onChange={e => setForm({ ...form, language: e.target.value })}>
                <option value="" disabled>Select</option>
                {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {err ? <div className={styles.err}>{err}</div> : null}
      <div className={styles.modalActions}>
        <button className={styles.primary} onClick={save}>{submitLabel}</button>
      </div>
    </>
  );
}

function AddEmployeeModal({ onClose, onSaved }) {
  return (
    <Modal title="Add New Employee" onClose={onClose}>
      <EmployeeForm
        initial={{ firstName:'', lastName:'', email:'', location: '', language: LANGS[0] }}
        onCancel={onClose}
        submitLabel="Save"
        onSubmit={async (form) => {
          await api.post('/api/admin/employees', form);
          onSaved();
          onClose();
        }}
      />
    </Modal>
  );
}

function EditEmployeeModal({ employee, onClose, onSaved }) {
  return (
    <Modal title="Edit Employee" onClose={onClose}>
      <EmployeeForm
        initial={employee}
        onCancel={onClose}
        submitLabel="Save"
        onSubmit={async (form) => {
          await api.put(`/api/admin/employees/${employee.id}`, form);
          onSaved();
          onClose();
        }}
      />
    </Modal>
  );
}

function OptionsMenuPortal({ pos, onClose, onEdit, onDelete, menuRef }) {
  if (!pos) return null;
  return createPortal(
    <div className={styles.menuPortal}>
      <div className={styles.menu} style={{ left: pos.left, top: pos.top }} ref={menuRef}>
        <button className={styles.menuItem} onClick={onEdit}>
          <span className={styles.menuIconBox} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21h3.75L19.81 7.94a1.5 1.5 0 0 0 0-2.12L18.18 4.19a1.5 1.5 0 0 0-2.12 0L3 17.25V21z" stroke="#111" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M14.5 5.5l4 4" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          Edit
        </button>
        <button className={styles.menuItemDanger} onClick={onDelete}>
          <span className={styles.menuIconBox} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7h16" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 11v6" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 11v6" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 7l1 14h10l1-14" stroke="#111" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M9 7V4h6v3" stroke="#111" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </span>
          Delete
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function Employees() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState({ items: [], totalPages: 1, total: 0 });

  const [showAdd, setShowAdd] = useState(false);
  const [editEmp, setEditEmp] = useState(null);

  const [selected, setSelected] = useState({});
  const [menuPos, setMenuPos] = useState(null); // { id, left, top }
  const menuRef = useRef(null);
  const tableBodyRef = useRef(null);

  const load = async (p = page, q = search) => {
    const { data } = await api.get('/api/admin/employees', { params: { page: p, search: q, limit: PAGE_SIZE } });
    setRes(data);
  };

  useEffect(() => { load(1, ''); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, search);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(page, search); }, [page]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuPos(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggleSelected = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const allSelectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const bulkDelete = async () => {
    if (allSelectedIds.length === 0) return;
    if (!confirm(`Delete ${allSelectedIds.length} employees?`)) return;
    await api.post('/api/admin/employees/bulk-delete', { ids: allSelectedIds });
    setSelected({});
    await load(page, search);
  };

  const rows = useMemo(() => res.items || [], [res]);

  const openMenu = (empId, btnEl) => {
    const rect = btnEl.getBoundingClientRect();
    const menuW = 170;
    const menuH = 104;

    let left = rect.right - menuW;
    let top = rect.bottom + 8;
    if (left < 8) left = 8;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (top + menuH > window.innerHeight - 8) top = rect.top - menuH - 8;
    if (top < 8) top = 8;
    setMenuPos({ id: empId, left, top });
  };

  return (
    <div className={styles.page}>
      <TopSearch value={search} onChange={setSearch} />

      <div className={styles.topRow}>
        <Breadcrumbs />
        <div className={styles.actions}>
          {allSelectedIds.length > 0 ? (
            <button className={styles.deleteBtn} onClick={bulkDelete}>Delete</button>
          ) : null}
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>Add Employees</button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <div className={styles.thCheck}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={rows.length > 0 && allSelectedIds.length === rows.length}
              onChange={() => {
                if (rows.length === 0) return;
                const all = allSelectedIds.length === rows.length;
                const next = {};
                rows.forEach(r => { next[r.id] = !all; });
                setSelected(next);
              }}
              aria-label="Select all"
            />
          </div>
          <div className={styles.th}>Name</div>
          <div className={styles.th}>Employee ID</div>
          <div className={styles.th}>Assigned Leads</div>
          <div className={styles.th}>Closed Leads</div>
          <div className={styles.th}>Status</div>
          <div></div>
        </div>

        <div className={styles.tableBody} ref={tableBodyRef} onScroll={() => setMenuPos(null)}>
          {rows.map((e) => (
            <div className={styles.row} key={e.id}>
              <div className={styles.cell}>
                <input className={styles.checkbox} type="checkbox" checked={!!selected[e.id]} onChange={() => toggleSelected(e.id)} />
              </div>

              <div className={styles.nameCell}>
                <InitialsAvatar firstName={e.firstName} lastName={e.lastName} />
                <div>
                  <div className={styles.name}>{e.firstName} {e.lastName}</div>
                  <div className={styles.email}>{e.email}</div>
                </div>
              </div>

              <div className={styles.cellStrong}>{e.employeeID}</div>
              <div className={styles.cellStrong}>{e.assignedLeads}</div>
              <div className={styles.cellStrong}>{e.closedLeads}</div>
              <div className={styles.cell}>
                <span className={e.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                  <span className={e.status === 'Active' ? styles.dotActive : styles.dotInactive} aria-hidden="true" />
                  {e.status}
                </span>
              </div>

              <div className={styles.cellRight}>
                <button
                  className={styles.dots}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (menuPos?.id === e.id) return setMenuPos(null);
                    openMenu(e.id, ev.currentTarget);
                  }}
                  aria-label="Options"
                >
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Pagination
        page={res.page || 1}
        totalPages={res.totalPages || 1}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(res.totalPages || 1, p + 1))}
        onPage={setPage}
      />

      <OptionsMenuPortal
        pos={menuPos}
        menuRef={menuRef}
        onClose={() => setMenuPos(null)}
        onEdit={() => {
          const emp = rows.find(r => r.id === menuPos?.id);
          if (!emp) return;
          setEditEmp(emp);
          setMenuPos(null);
        }}
        onDelete={async () => {
          const empId = menuPos?.id;
          setMenuPos(null);
          if (!empId) return;
          if (!confirm('Delete this employee?')) return;
          await api.delete(`/api/admin/employees/${empId}`);
          await load(page, search);
        }}
      />

      {showAdd ? <AddEmployeeModal onClose={() => setShowAdd(false)} onSaved={() => load(page, search)} /> : null}
      {editEmp ? <EditEmployeeModal employee={editEmp} onClose={() => setEditEmp(null)} onSaved={() => load(page, search)} /> : null}
    </div>
  );
}
