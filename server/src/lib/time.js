export function getDateKey(d = new Date()) {
  // server-local YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1 - day); // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}

export function endOfWeek(d = new Date()) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
