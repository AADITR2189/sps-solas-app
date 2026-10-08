import type { DateKey } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(k: DateKey, n: number): DateKey {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function startOfWeek(k: DateKey, weekStartsOn: 0 | 1): DateKey {
  const d = fromKey(k);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toKey(d);
}

export const monthKey = (k: DateKey) => k.slice(0, 7); // "2026-10"

export function startOfMonth(k: DateKey): DateKey {
  return `${monthKey(k)}-01`;
}

export function daysInMonth(year: number, monthIdx: number) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

export function isValidKey(k: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return false;
  return toKey(fromKey(k)) === k;
}

export function formatLong(k: DateKey) {
  return fromKey(k).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShort(k: DateKey) {
  return fromKey(k).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatMonth(k: DateKey) {
  return fromKey(k).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function relativeLabel(k: DateKey) {
  const t = todayKey();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  return formatShort(k);
}
