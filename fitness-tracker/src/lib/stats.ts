import type { DateKey, MuscleGroup, Session, SetEntry, StrengthEntry } from '../types';
import { addDays, monthKey, startOfWeek, todayKey, fromKey } from './date';

export const setVolume = (s: SetEntry) => (s.reps || 0) * (s.weight || 0);
export const entryVolume = (e: StrengthEntry) => e.sets.reduce((a, s) => a + setVolume(s), 0);
export const sessionVolume = (s: Session) => s.strength.reduce((a, e) => a + entryVolume(e), 0);
export const sessionCardioMin = (s: Session) => s.cardio.reduce((a, c) => a + (c.durationMin || 0), 0);
export const sessionDistance = (s: Session) => s.cardio.reduce((a, c) => a + (c.distance || 0), 0);

/** Epley estimated one-rep max. */
export const e1rm = (s: SetEntry) => (s.reps <= 1 ? s.weight : s.weight * (1 + s.reps / 30));

export function fmtNum(n: number, digits = 0) {
  if (!isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 10_000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export const inRange = (d: DateKey, from?: DateKey, to?: DateKey) =>
  (!from || d >= from) && (!to || d <= to);

export interface PeriodSummary {
  sessions: number;
  strength: number;
  cardio: number;
  days: number;
  volume: number;
  cardioMin: number;
  distance: number;
}

export function summarize(list: Session[]): PeriodSummary {
  const days = new Set<string>();
  const r: PeriodSummary = { sessions: 0, strength: 0, cardio: 0, days: 0, volume: 0, cardioMin: 0, distance: 0 };
  for (const s of list) {
    r.sessions++;
    if (s.kind === 'strength') r.strength++;
    else r.cardio++;
    days.add(s.date);
    r.volume += sessionVolume(s);
    r.cardioMin += sessionCardioMin(s);
    r.distance += sessionDistance(s);
  }
  r.days = days.size;
  return r;
}

export function streaks(list: Session[]) {
  const days = new Set(list.map((s) => s.date));
  const today = todayKey();
  // current streak may start today or yesterday (today not logged yet shouldn't break it)
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest };
}

export function volumeByMuscle(list: Session[]) {
  const m = new Map<MuscleGroup, { volume: number; sets: number; sessions: Set<string> }>();
  for (const s of list)
    for (const e of s.strength) {
      const cur = m.get(e.muscleGroup) ?? { volume: 0, sets: 0, sessions: new Set() };
      cur.volume += entryVolume(e);
      cur.sets += e.sets.length;
      cur.sessions.add(s.id);
      m.set(e.muscleGroup, cur);
    }
  return [...m.entries()]
    .map(([group, v]) => ({ group, volume: Math.round(v.volume), sets: v.sets, sessions: v.sessions.size }))
    .sort((a, b) => b.volume - a.volume || b.sets - a.sets);
}

export function exerciseUsage(list: Session[]) {
  const m = new Map<string, { exercise: string; muscleGroup: MuscleGroup; count: number; last: string; sets: number }>();
  for (const s of list)
    for (const e of s.strength) {
      const cur = m.get(e.exercise) ?? { exercise: e.exercise, muscleGroup: e.muscleGroup, count: 0, last: '', sets: 0 };
      cur.count++;
      cur.sets += e.sets.length;
      if (s.date >= cur.last) {
        cur.last = s.date;
        cur.muscleGroup = e.muscleGroup;
      }
      m.set(e.exercise, cur);
    }
  return [...m.values()];
}

export function cardioUsage(list: Session[]) {
  const m = new Map<string, { activity: string; count: number; minutes: number; distance: number; last: string }>();
  for (const s of list)
    for (const c of s.cardio) {
      const cur = m.get(c.activity) ?? { activity: c.activity, count: 0, minutes: 0, distance: 0, last: '' };
      cur.count++;
      cur.minutes += c.durationMin || 0;
      cur.distance += c.distance || 0;
      if (s.date > cur.last) cur.last = s.date;
      m.set(c.activity, cur);
    }
  return [...m.values()].sort((a, b) => b.minutes - a.minutes);
}

export interface PR {
  exercise: string;
  muscleGroup: MuscleGroup;
  maxWeight: number;
  maxWeightReps: number;
  maxWeightDate: string;
  best1rm: number;
  best1rmDate: string;
  bestSetVolume: number;
  bestSessionVolume: number;
}

export function personalRecords(list: Session[]): PR[] {
  const m = new Map<string, PR>();
  for (const s of list)
    for (const e of s.strength) {
      const pr =
        m.get(e.exercise) ??
        ({
          exercise: e.exercise,
          muscleGroup: e.muscleGroup,
          maxWeight: 0,
          maxWeightReps: 0,
          maxWeightDate: '',
          best1rm: 0,
          best1rmDate: '',
          bestSetVolume: 0,
          bestSessionVolume: 0,
        } as PR);
      for (const set of e.sets) {
        if (!set.reps) continue;
        if (set.weight > pr.maxWeight || (set.weight === pr.maxWeight && set.reps > pr.maxWeightReps)) {
          pr.maxWeight = set.weight;
          pr.maxWeightReps = set.reps;
          pr.maxWeightDate = s.date;
        }
        const est = e1rm(set);
        if (est > pr.best1rm) {
          pr.best1rm = est;
          pr.best1rmDate = s.date;
        }
        pr.bestSetVolume = Math.max(pr.bestSetVolume, setVolume(set));
      }
      pr.bestSessionVolume = Math.max(pr.bestSessionVolume, entryVolume(e));
      m.set(e.exercise, pr);
    }
  return [...m.values()].filter((p) => p.maxWeight > 0 || p.maxWeightReps > 0);
}

/** Per-session best for one exercise, oldest first — for progression charts. */
export function exerciseProgression(list: Session[], exercise: string) {
  const rows: { date: string; maxWeight: number; e1rm: number; volume: number }[] = [];
  const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
  for (const s of sorted)
    for (const e of s.strength) {
      if (e.exercise !== exercise || !e.sets.length) continue;
      rows.push({
        date: s.date,
        maxWeight: Math.max(...e.sets.map((x) => x.weight || 0)),
        e1rm: Math.round(Math.max(...e.sets.map(e1rm)) * 10) / 10,
        volume: Math.round(entryVolume(e)),
      });
    }
  return rows;
}

/** Last N weeks of totals, oldest first. */
export function weeklyTrend(list: Session[], weeks: number, weekStartsOn: 0 | 1) {
  const thisWeek = startOfWeek(todayKey(), weekStartsOn);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    const d = fromKey(start);
    return {
      key: start,
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      volume: 0,
      cardioMin: 0,
      distance: 0,
      sessions: 0,
    };
  });
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const s of list) {
    const i = idx.get(startOfWeek(s.date, weekStartsOn));
    if (i === undefined) continue;
    const b = buckets[i];
    b.volume += sessionVolume(s);
    b.cardioMin += sessionCardioMin(s);
    b.distance += sessionDistance(s);
    b.sessions++;
  }
  return buckets.map((b) => ({ ...b, volume: Math.round(b.volume), distance: Math.round(b.distance * 10) / 10 }));
}

/** Last N months of totals, oldest first. */
export function monthlyTrend(list: Session[], months: number) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      volume: 0,
      cardioMin: 0,
      distance: 0,
      sessions: 0,
      days: new Set<string>(),
    };
  });
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const s of list) {
    const i = idx.get(monthKey(s.date));
    if (i === undefined) continue;
    const b = buckets[i];
    b.volume += sessionVolume(s);
    b.cardioMin += sessionCardioMin(s);
    b.distance += sessionDistance(s);
    b.sessions++;
    b.days.add(s.date);
  }
  return buckets.map(({ days, ...b }) => ({
    ...b,
    activeDays: days.size,
    volume: Math.round(b.volume),
    distance: Math.round(b.distance * 10) / 10,
  }));
}

/** Most recent sets logged for an exercise — used to pre-fill new entries. */
export function lastSetsFor(list: Session[], exercise: string): StrengthEntry['sets'] | null {
  let best: { date: string; createdAt: number; sets: StrengthEntry['sets'] } | null = null;
  for (const s of list)
    for (const e of s.strength)
      if (e.exercise === exercise && e.sets.length) {
        if (!best || s.date > best.date || (s.date === best.date && s.createdAt > best.createdAt))
          best = { date: s.date, createdAt: s.createdAt, sets: e.sets };
      }
  return best ? best.sets.map((x) => ({ ...x })) : null;
}
