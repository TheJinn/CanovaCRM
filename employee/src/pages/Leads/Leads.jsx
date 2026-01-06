import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import AppHeader from '../../shared/AppHeader/AppHeader.jsx';
import styles from './Leads.module.css';

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 21l-4.35-4.35" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="#111" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.2829 0.769857C13.2829 0.345052 13.7028 0 14.222 0C14.7412 0 15.1611 0.345052 15.1611 0.769857V4.14225C15.1611 4.56706 14.7412 4.91211 14.222 4.91211C13.7028 4.91211 13.2829 4.56706 13.2829 4.14225V0.769857ZM10.7601 16.8962C10.7048 16.8962 10.6608 16.6634 10.6608 16.3753C10.6608 16.0872 10.7048 15.8545 10.7601 15.8545H13.3301C13.3854 15.8545 13.4294 16.0872 13.4294 16.3753C13.4294 16.6634 13.3854 16.8962 13.3301 16.8962H10.7601ZM2.57975 10.9196C2.52441 10.9196 2.48047 10.6868 2.48047 10.3988C2.48047 10.1107 2.52441 9.87793 2.57975 9.87793H5.14974C5.20508 9.87793 5.24902 10.1107 5.24902 10.3988C5.24902 10.6868 5.20508 10.9196 5.14974 10.9196H2.57975ZM6.66992 10.9196C6.61458 10.9196 6.57064 10.6868 6.57064 10.3988C6.57064 10.1107 6.61458 9.87793 6.66992 9.87793H9.23991C9.29525 9.87793 9.33919 10.1107 9.33919 10.3988C9.33919 10.6868 9.29525 10.9196 9.23991 10.9196H6.66992ZM10.7601 10.9196C10.7048 10.9196 10.6608 10.6868 10.6608 10.3988C10.6608 10.1107 10.7048 9.87793 10.7601 9.87793H13.3301C13.3854 9.87793 13.4294 10.1107 13.4294 10.3988C13.4294 10.6868 13.3854 10.9196 13.3301 10.9196H10.7601ZM14.8519 10.9196C14.7966 10.9196 14.7526 10.6868 14.7526 10.3988C14.7526 10.1107 14.7966 9.87793 14.8519 9.87793H17.4219C17.4772 9.87793 17.5212 10.1107 17.5212 10.3988C17.5212 10.6868 17.4772 10.9196 17.4219 10.9196H14.8519ZM2.57975 13.9079C2.52441 13.9079 2.48047 13.6751 2.48047 13.387C2.48047 13.099 2.52441 12.8662 2.57975 12.8662H5.14974C5.20508 12.8662 5.24902 13.099 5.24902 13.387C5.24902 13.6751 5.20508 13.9079 5.14974 13.9079H2.57975ZM6.66992 13.9079C6.61458 13.9079 6.57064 13.6751 6.57064 13.387C6.57064 13.099 6.61458 12.8662 6.66992 12.8662H9.23991C9.29525 12.8662 9.33919 13.099 9.33919 13.387C9.33919 13.6751 9.29525 13.9079 9.23991 13.9079H6.66992ZM10.7601 13.9079C10.7048 13.9079 10.6608 13.6751 10.6608 13.387C10.6608 13.099 10.7048 12.8662 10.7601 12.8662H13.3301C13.3854 12.8662 13.4294 13.099 13.4294 13.387C13.4294 13.6751 13.3854 13.9079 13.3301 13.9079H10.7601ZM14.8519 13.9079C14.7966 13.9079 14.7526 13.6751 14.7526 13.387C14.7526 13.099 14.7966 12.8662 14.8519 12.8662H17.4219C17.4772 12.8662 17.5212 13.099 17.5212 13.387C17.5212 13.6751 17.4772 13.9079 17.4219 13.9079H14.8519ZM2.57975 16.8962C2.52441 16.8962 2.48047 16.6634 2.48047 16.3753C2.48047 16.0872 2.52441 15.8545 2.57975 15.8545H5.14974C5.20508 15.8545 5.24902 16.0872 5.24902 16.3753C5.24902 16.6634 5.20508 16.8962 5.14974 16.8962H2.57975ZM6.66992 16.8962C6.61458 16.8962 6.57064 16.6634 6.57064 16.3753C6.57064 16.0872 6.61458 15.8545 6.66992 15.8545H9.23991C9.29525 15.8545 9.33919 16.0872 9.33919 16.3753C9.33919 16.6634 9.29525 16.8962 9.23991 16.8962H6.66992ZM4.81934 0.769857C4.81934 0.345052 5.23926 0 5.75846 0C6.27767 0 6.69759 0.345052 6.69759 0.769857V4.14225C6.69759 4.56706 6.27767 4.91211 5.75846 4.91211C5.23926 4.91211 4.81934 4.56706 4.81934 4.14225V0.769857ZM1.04167 7.3763H18.9567V3.49447C18.9567 3.36426 18.903 3.24544 18.8167 3.15755C18.7305 3.07129 18.6117 3.01758 18.4798 3.01758H16.7643C16.4762 3.01758 16.2435 2.78483 16.2435 2.49674C16.2435 2.20866 16.4762 1.97591 16.7643 1.97591H18.4814C18.8997 1.97591 19.279 2.14681 19.554 2.42188C19.8291 2.69694 20 3.07617 20 3.49447V7.89876V18.4831C20 18.9014 19.8291 19.2806 19.554 19.5557C19.279 19.8307 18.8997 20.0016 18.4814 20.0016H1.51855C1.10026 20.0016 0.721029 19.8307 0.445964 19.5557C0.170898 19.279 0 18.8997 0 18.4814V7.89714V3.49447C0 3.07617 0.170898 2.69694 0.445964 2.42188C0.721029 2.14681 1.10026 1.97591 1.51855 1.97591H3.35286C3.64095 1.97591 3.8737 2.20866 3.8737 2.49674C3.8737 2.78483 3.64095 3.01758 3.35286 3.01758H1.51855C1.38835 3.01758 1.26953 3.07129 1.18164 3.15755C1.09538 3.24382 1.04167 3.36263 1.04167 3.49447V7.3763ZM18.9583 8.4196H1.04167V18.4814C1.04167 18.6117 1.09538 18.7305 1.18164 18.8184C1.2679 18.9046 1.38672 18.9583 1.51855 18.9583H18.4814C18.6117 18.9583 18.7305 18.9046 18.8184 18.8184C18.9046 18.7321 18.9583 18.6133 18.9583 18.4814V8.4196ZM8.20801 3.01758C7.91992 3.01758 7.68717 2.78483 7.68717 2.49674C7.68717 2.20866 7.91992 1.97591 8.20801 1.97591H11.7057C11.9938 1.97591 12.2266 2.20866 12.2266 2.49674C12.2266 2.78483 11.9938 3.01758 11.7057 3.01758H8.20801Z" fill="#445668"/>
    </svg>

  );
}

function TypeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.99831 0C10.5542 0 11.0981 0.044 11.63 0.132L9.75835 2.004C8.19799 2.05083 6.68544 2.5533 5.40715 3.44948C4.12886 4.34566 3.1407 5.59636 2.56448 7.04743C1.98826 8.49849 1.84917 10.0865 2.16435 11.6156C2.47954 13.1448 3.23522 14.5483 4.33825 15.6531C5.44128 16.758 6.84344 17.5158 8.37189 17.8333C9.90033 18.1507 11.4883 18.0139 12.9399 17.4397C14.3916 16.8655 15.6435 15.879 16.5414 14.6018C17.4393 13.3246 17.9439 11.8125 17.9929 10.252L19.8666 8.38C19.9533 8.90666 19.9966 9.44666 19.9966 10C19.9966 11.9778 19.4102 13.9112 18.3116 15.5557C17.213 17.2002 15.6514 18.4819 13.8245 19.2388C11.9975 19.9957 9.98722 20.1937 8.04774 19.8078C6.10825 19.422 4.32673 18.4696 2.92844 17.0711C1.53015 15.6725 0.577906 13.8907 0.192119 11.9509C-0.193668 10.0111 0.0043321 8.00042 0.76108 6.17316C1.51783 4.3459 2.79934 2.78412 4.44355 1.6853C6.08776 0.58649 8.02083 0 9.99831 0ZM18.8788 1.124C18.5234 0.768479 18.1014 0.486461 17.637 0.294051C17.1727 0.101642 16.6749 0.00260949 16.1723 0.00260949C15.6696 0.00260949 15.1719 0.101642 14.7075 0.294051C14.2431 0.486461 13.8211 0.768479 13.4657 1.124L8.2986 6.292C8.18979 6.40111 8.10766 6.5339 8.05864 6.68L6.09097 12.52C6.02566 12.714 6.01577 12.9224 6.06243 13.1217C6.10908 13.321 6.21042 13.5034 6.35505 13.6483C6.49967 13.7931 6.68184 13.8947 6.88107 13.9417C7.08029 13.9886 7.28866 13.979 7.48273 13.914L13.3217 11.95C13.4685 11.9012 13.602 11.8191 13.7117 11.71L18.8788 6.54C19.2343 6.18453 19.5162 5.76251 19.7086 5.29804C19.901 4.83357 20 4.33575 20 3.833C20 3.33025 19.901 2.83243 19.7086 2.36796C19.5162 1.90349 19.2343 1.47947 18.8788 1.124Z" fill="#2051E5"/>
    </svg>

  );
}

function ScheduleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 9.6V6C11 5.71666 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 9.99999 5C9.71733 4.99933 9.47999 5.09533 9.288 5.288C9.09599 5.48067 9 5.718 9 6V9.975C9 10.1083 9.02499 10.2377 9.075 10.363C9.125 10.4883 9.2 10.6007 9.3 10.7L12.6 14C12.7833 14.1833 13.0167 14.275 13.3 14.275C13.5833 14.275 13.8167 14.1833 14 14C14.1833 13.8167 14.275 13.5833 14.275 13.3C14.275 13.0167 14.1833 12.7833 14 12.6L11 9.6ZM9.99999 20C8.61666 20 7.31666 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.1757 1.31267 15.1173 0.788001 13.9C0.263335 12.6827 0.000667932 11.3827 1.26582e-06 10C-0.0006654 8.61733 0.262001 7.31733 0.788001 6.1C1.314 4.88267 2.02633 3.82433 2.925 2.925C3.82367 2.02567 4.882 1.31333 6.1 0.788C7.318 0.262667 8.618 0 9.99999 0C11.382 0 12.682 0.262667 13.9 0.788C15.118 1.31333 16.1763 2.02567 17.075 2.925C17.9737 3.82433 18.6863 4.88267 19.213 6.1C19.7397 7.31733 20.002 8.61733 20 10C19.998 11.3827 19.7353 12.6827 19.212 13.9C18.6887 15.1173 17.9763 16.1757 17.075 17.075C16.1737 17.9743 15.1153 18.687 13.9 19.213C12.6847 19.739 11.3847 20.0013 9.99999 20ZM9.99999 18C12.2167 18 14.1043 17.221 15.663 15.663C17.2217 14.105 18.0007 12.2173 18 10C17.9993 7.78266 17.2203 5.895 15.663 4.337C14.1057 2.779 12.218 2 9.99999 2C7.782 2 5.89433 2.77933 4.337 4.338C2.77967 5.89666 2.00067 7.784 2 10C1.99933 12.216 2.77867 14.1037 4.338 15.663C5.89733 17.2223 7.78466 18.0013 9.99999 18Z" fill="#2051E5"/>
    </svg>

  );
}

function StatusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="#2051E5" stroke-width="2"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M9.33344 13.7217L4 8.34415L5.33312 7L10 11.7055L14.6669 7L16 8.34415L10.6666 13.7217C10.4898 13.8999 10.25 14 10 14C9.75 14 9.51024 13.8999 9.33344 13.7217Z" fill="#2051E5"/>
    </svg>

  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 17v-5" stroke="#7a7a7a" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="#7a7a7a" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" stroke="#7a7a7a" strokeWidth="2" />
    </svg>
  );
}

function fmtPrettyDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'long', day: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

function ringColor(type) {
  if (type === 'hot') return '#FF7A00';
  if (type === 'cold') return '#6FE7F1';
  return '#F2C200'; // warm default
}

export default function Leads() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [leads, setLeads] = useState([]);
  const [q, setQ] = useState('');

  // Popover state (anchored to the icon button, like the design)
  // kind: 'type' | 'schedule' | 'status'
  const [popover, setPopover] = useState(null);
  const popoverRef = useRef(null);
  const popoverAnchorRef = useRef(null);

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const [statusValue, setStatusValue] = useState('ongoing');
  const [showStatusTip, setShowStatusTip] = useState(false);

  const load = async () => {
    const [meRes, leadsRes] = await Promise.all([
      api.get('/api/employee/me'),
      api.get('/api/employee/leads'),
    ]);
    setMe(meRes.data);
    // Backends may return: [] OR { items: [] } OR { leads: [] } OR { data: [] }
    // Normalize here so the UI always works with an array.
    const raw = leadsRes?.data;
    const normalized = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.leads)
          ? raw.leads
          : Array.isArray(raw?.data)
            ? raw.data
            : [];

    setLeads(normalized);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = Array.isArray(leads) ? leads : [];
    if (!s) return list;
    return list.filter((l) =>
      (l?.name || '').toLowerCase().includes(s) || (l?.email || '').toLowerCase().includes(s)
    );
  }, [q, leads]);

  const openType = (e, lead) => {
    const r = e.currentTarget.getBoundingClientRect();
    popoverAnchorRef.current = e.currentTarget;
    setPopover({ kind: 'type', leadId: lead._id, x: r.left + r.width / 2, y: r.bottom });
  };

  const openSchedule = (e, lead) => {
    const r = e.currentTarget.getBoundingClientRect();
    popoverAnchorRef.current = e.currentTarget;
    setPopover({ kind: 'schedule', leadId: lead._id, x: r.left + r.width / 2, y: r.bottom });
    const sd = lead?.scheduleDate ? new Date(lead.scheduleDate) : null;
    setScheduleDate(sd ? sd.toISOString().slice(0, 10) : '');
    setScheduleTime(sd ? sd.toTimeString().slice(0, 5) : '');
  };

  const saveSchedule = async () => {
    const scheduleLeadId = popover?.kind === 'schedule' ? popover.leadId : null;
    if (!scheduleLeadId) return;
    if (!scheduleDate || !scheduleTime) return;

    const [y, m, d] = scheduleDate.split('-').map((x) => parseInt(x, 10));
    const [hh, mm] = scheduleTime.split(':').map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);

    await api.patch(`/api/employee/leads/${scheduleLeadId}/schedule`, { scheduleDate: dt.toISOString() });
    setPopover(null);
    await load();
  };

  const setType = async (leadId, type) => {
    // Backend expects "Hot" | "Warm" | "Cold"
    const payloadType = type ? (type[0].toUpperCase() + type.slice(1).toLowerCase()) : 'Warm';
    await api.patch(`/api/employee/leads/${leadId}/type`, { type: payloadType });
    setPopover(null);
    await load();
  };

  const openStatus = (e, lead) => {
    const r = e.currentTarget.getBoundingClientRect();
    popoverAnchorRef.current = e.currentTarget;
    setPopover({ kind: 'status', leadId: lead._id, x: r.left + r.width / 2, y: r.bottom });
    setStatusValue((lead?.status || 'ongoing').toLowerCase());
    setShowStatusTip(false);
  };

  const saveStatus = async () => {
    const statusLeadId = popover?.kind === 'status' ? popover.leadId : null;
    if (!statusLeadId) return;
    const list = Array.isArray(leads) ? leads : [];
    const lead = list.find((l) => l._id === statusLeadId);
    if (!lead) return;

    const scheduled = !!lead.scheduleDate;
    const scheduledInFuture = scheduled && new Date(lead.scheduleDate).getTime() > Date.now();

    if (statusValue === 'closed') {
      if (scheduledInFuture) {
        setShowStatusTip(true);
        return;
      }
      await api.patch(`/api/employee/leads/${lead._id}/close`);
    }

    setPopover(null);
    await load();
  };

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return;
    const onDown = (evt) => {
      const pop = popoverRef.current;
      const anchor = popoverAnchorRef.current;
      if (pop && pop.contains(evt.target)) return;
      if (anchor && anchor.contains(evt.target)) return;
      setPopover(null);
      setShowStatusTip(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [popover]);

  // Keep popover within the phone viewport
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!popover) return;
    const el = popoverRef.current;
    if (!el) return;

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = (popover.x || 0) - w / 2;
    left = Math.max(pad, Math.min(left, vw - w - pad));
    let top = (popover.y || 0) + 10;
    // If it would overflow bottom, open upward
    if (top + h > vh - pad) top = (popover.y || 0) - h - 10;
    top = Math.max(pad, Math.min(top, vh - h - pad));

    setPos({ top, left });
  }, [popover]);

  return (
    <div className={styles.page}>
      <AppHeader title="Leads" showBack />

      <div className={styles.searchWrap}>
        <div className={styles.searchIcon}><SearchIcon /></div>
        <input
          className={styles.search}
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search leads"
        />
      </div>

      <div className={styles.list}>
        {filtered.map((lead) => {
          const type = (lead?.type || 'warm').toLowerCase();
          const status = (lead?.status || 'ongoing').toLowerCase();
          const ring = ringColor(type);
          const ringAlpha = status === 'closed' ? 0.30 : 1;

          return (
            <div key={lead._id} className={styles.card}>
              <div className={styles.strip} style={{ background: ring, opacity: ringAlpha }} />

              <div className={styles.cardBody}>
                <div className={styles.topRow}>
                  <div className={styles.left}>
                    <div className={styles.leadName}>{lead?.name || '-'}</div>
                    <div className={styles.leadEmail}>{lead?.email || '-'}</div>
                  </div>

                  <div className={styles.right}>
                    <div className={styles.statusCircle} style={{ borderColor: ring, opacity: ringAlpha }}>
                      <span className={styles.statusText}>{status === 'closed' ? 'Closed' : 'Ongoing'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.bottomRow}>
                  <div className={styles.dateRow}>
                    <CalendarIcon />
                    <div className={styles.dateText}>{fmtPrettyDate(lead?.date || lead?.createdAt)}</div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.iconBtn} onClick={(e) => openType(e, lead)} aria-label="Change type">
                      <TypeIcon />
                    </button>
                    <button className={styles.iconBtn} onClick={(e) => openSchedule(e, lead)} aria-label="Schedule lead">
                      <ScheduleIcon />
                    </button>
                    <button className={styles.iconBtn} onClick={(e) => openStatus(e, lead)} aria-label="Change status">
                      <StatusIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <div className={styles.empty}>No leads found</div>
        ) : null}
      </div>

      {popover ? (
        <div
          ref={popoverRef}
          className={styles.popover}
          data-kind={popover.kind}
          style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {popover.kind === 'type' ? (
            <div className={styles.popInner}>
              <div className={styles.popTitle}>Type</div>
              <button className={`${styles.typeBtn} ${styles.typeHot}`} onClick={() => setType(popover.leadId, 'hot')}>Hot</button>
              <button className={`${styles.typeBtn} ${styles.typeWarm}`} onClick={() => setType(popover.leadId, 'warm')}>Warm</button>
              <button className={`${styles.typeBtn} ${styles.typeCold}`} onClick={() => setType(popover.leadId, 'cold')}>Cold</button>
            </div>
          ) : null}

          {popover.kind === 'schedule' ? (
            <div className={styles.popInner}>
              <div className={styles.popTitle}>Date</div>
              <input className={styles.field} type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />

              <div className={styles.popTitle} style={{ marginTop: 10 }}>Time</div>
              <input className={styles.field} type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />

              <button className={styles.saveBtn} onClick={saveSchedule}>Save</button>
            </div>
          ) : null}

          {popover.kind === 'status' ? (
            <div className={styles.popInner}>
              <div className={styles.statusHeader}>
                <div className={styles.popTitle}>Lead Status</div>
                <div className={styles.tipWrap}>
                  <button
                    className={styles.infoBtn}
                    onClick={() => setShowStatusTip((v) => !v)}
                    aria-label="Lead status info"
                  >
                    <InfoIcon />
                  </button>
                  {showStatusTip ? (
                    <div className={styles.tooltip}>Lead cannot be closed if scheduled</div>
                  ) : null}
                </div>
              </div>

              <select className={styles.select} value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                <option value="ongoing">Ongoing</option>
                <option
                  value="closed"
                  disabled={(() => {
                    const list = Array.isArray(leads) ? leads : [];
                    const l = list.find((x) => x._id === popover.leadId);
                    return l?.scheduleDate && new Date(l.scheduleDate).getTime() > Date.now();
                  })()}
                >
                  Closed
                </option>
              </select>

              <button className={styles.saveBtn} onClick={saveStatus}>Save</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
