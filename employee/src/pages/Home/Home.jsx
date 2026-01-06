import React, { useEffect, useMemo, useState } from 'react';
import styles from './Home.module.css';
import api from '../../lib/api.js';
import AppHeader from '../../shared/AppHeader/AppHeader.jsx';

function formatTime(d) {
  if (!d) return '';
  const x = new Date(d);
  return x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(d) {
  const x = new Date(d);
  return x.toLocaleDateString();
}

function timeAgo(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function toSecondPerson(msg, me) {
  if (!msg) return '';
  const first = me?.firstName || '';
  const last = me?.lastName || '';
  const full = `${first} ${last}`.trim();
  let out = msg;
  if (full) out = out.replaceAll(full, 'You');
  if (first) out = out.replaceAll(first, 'You');
  // normalize common lowercase
  out = out.replaceAll('you', 'You');
  return out;
}

function ToggleButton({ state, disabled, onClick }) {
  // state: 'idle' | 'on' | 'off'
  let cls = styles.toggleIdle;
  if (state === 'on') cls = styles.toggleOn;
  if (state === 'off') cls = styles.toggleOff;

  return (
    <button className={`${styles.toggle} ${cls}`} disabled={disabled} onClick={onClick} aria-label="toggle" />
  );
}

export default function Home() {
  const [me, setMe] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [breakHistory, setBreakHistory] = useState([]);
  const [activities, setActivities] = useState([]);

  const load = async () => {
    const [meR, attR, bhR, actR] = await Promise.all([
      api.get('/api/employee/me'),
      api.get('/api/employee/attendance/today'),
      api.get('/api/employee/attendance/break-history', { params: { days: 14 } }),
      api.get('/api/employee/activities', { params: { limit: 10 } }),
    ]);
    setMe(meR.data.user);
    setAttendance(attR.data.attendance);
    setBreakHistory(bhR.data.items || []);
    setActivities(actR.data.items || []);
  };

  useEffect(() => { load(); }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const checkInAt = attendance?.checkInAt;
  const checkOutAt = attendance?.checkOutAt;
  const breakStartAt = attendance?.breakStartAt;
  const breakEndAt = attendance?.breakEndAt;

  const checkBtnState = !checkInAt ? 'idle' : (checkOutAt ? 'off' : 'on');
  const checkDisabled = checkOutAt; // cannot re-checkin same day once checked out

  const breakBtnState = !breakStartAt ? 'idle' : (breakEndAt ? 'off' : 'on');
  const breakDisabled = !checkInAt || !!breakEndAt || !!checkOutAt; // only after checkin, only one break/day, not after checkout

  const onCheckToggle = async () => {
    if (!checkInAt) await api.post('/api/employee/attendance/checkin');
    else if (!checkOutAt) await api.post('/api/employee/attendance/checkout');
    await load();
  };

  const onBreakToggle = async () => {
    if (!breakStartAt) await api.post('/api/employee/attendance/break/start');
    else if (!breakEndAt) await api.post('/api/employee/attendance/break/end');
    await load();
  };

  return (
    <div className={styles.page}>
      <AppHeader>
        <div className={styles.greet}>{greeting}</div>
        <div className={styles.name}>{(me?.firstName || '') + (me?.lastName ? ' ' + me.lastName : '')}</div>
      </AppHeader>

      <div className={styles.timingsTitle}>Timings</div>

      <div className={styles.cards}>
        <div className={styles.timingCard}>
          <div className={styles.cardGrid}>
            <div className={styles.cardCol}>
              <div className={styles.cardColTitle}>{checkInAt ? 'Checked-In' : 'Check in'}</div>
              <div className={styles.cardColValue}>{checkInAt ? formatTime(checkInAt) : '--:-- —'}</div>
            </div>
            <div className={styles.cardCol}>
              <div className={styles.cardColTitle}>Check Out</div>
              <div className={styles.cardColValue}>{checkOutAt ? formatTime(checkOutAt) : '--:-- —'}</div>
            </div>
          </div>
          <ToggleButton state={checkBtnState} disabled={checkDisabled} onClick={onCheckToggle} />
        </div>

        <div className={styles.timingCard}>
          <div className={styles.cardGrid}>
            <div className={styles.cardCol}>
              <div className={styles.cardColTitle}>Break</div>
              <div className={styles.cardColValue}>{breakStartAt ? formatTime(breakStartAt) : '--:-- —'}</div>
            </div>
            <div className={styles.cardCol}>
              <div className={styles.cardColTitle}>Ended</div>
              <div className={styles.cardColValue}>{breakEndAt ? formatTime(breakEndAt) : '--:-- —'}</div>
            </div>
          </div>
          <ToggleButton state={breakBtnState} disabled={breakDisabled} onClick={onBreakToggle} />
        </div>
      </div>

      <div className={styles.breakHistoryWrap}>
        <div className={styles.breakTableHead}>
          <div>Break</div>
          <div>Ended</div>
          <div className={styles.right}>Date</div>
        </div>
        <div className={styles.breakTableBody}>
          {breakHistory.length === 0 ? (
            <div className={styles.empty}>No breaks yet.</div>
          ) : breakHistory.map((b) => (
            <div className={styles.breakRow} key={b._id}>
              <div>
                <div className={styles.breakLabel}>Break</div>
                <div className={styles.breakValue}>{formatTime(b.breakStartAt)}</div>
              </div>
              <div>
                <div className={styles.breakLabel}>Ended</div>
                <div className={styles.breakValue}>{formatTime(b.breakEndAt)}</div>
              </div>
              <div className={styles.right}>
                <div className={styles.breakLabel}>Date</div>
                <div className={styles.breakValue}>{b.dateKey || formatDate(b.breakStartAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sectionTitle}>Recent Activity</div>
      <div className={styles.activityBox}>
        {activities.length === 0 ? (
          <div className={styles.empty}>No recent activity.</div>
        ) : activities.map(a => (
          <div className={styles.actRow} key={a._id}>
            <div className={styles.bullet} />
            <div className={styles.actText}>
              <div className={styles.actMsg}>{toSecondPerson(a.message, me)} – {timeAgo(a.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
