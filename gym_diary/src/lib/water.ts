import type { BodyMeasurement, DateKey, Profile, Session, Settings, WaterLog } from '../types';
import { addDays, fromKey, todayKey } from './date';
import { currentWeight, toKg } from './body';
import { sessionDuration } from './stats';

export const DEFAULT_TARGET_ML = 2500;
export const DEFAULT_QUICK_SIZES = [250, 500, 750];
/** ml per kg of body weight for the suggested target. */
export const ML_PER_KG = 35;
/** Extra ml per 60 minutes of logged exercise on workout days. */
export const BONUS_ML_PER_HOUR = 500;

const ML_PER_OZ = 29.5735;
const round50 = (n: number) => Math.round(n / 50) * 50;

// ---------- Units ----------

export function fmtVolume(ml: number, unit: Settings['volumeUnit'], opts: { short?: boolean } = {}) {
  if (unit === 'oz') return `${Math.round(ml / ML_PER_OZ).toLocaleString()} ${opts.short ? 'oz' : 'fl oz'}`;
  if (Math.abs(ml) >= 1000) return `${(ml / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;
  return `${Math.round(ml).toLocaleString()} ml`;
}
/** Number shown in inputs for the user's unit. */
export const toUnit = (ml: number, unit: Settings['volumeUnit']) => (unit === 'oz' ? Math.round((ml / ML_PER_OZ) * 10) / 10 : Math.round(ml));
export const fromUnit = (v: number, unit: Settings['volumeUnit']) => (unit === 'oz' ? Math.round(v * ML_PER_OZ) : Math.round(v));
export const unitLabel = (unit: Settings['volumeUnit']) => (unit === 'oz' ? 'fl oz' : 'ml');

// ---------- Targets ----------

/** Weight-based suggestion: 35 ml per kg, rounded to 50 ml. Undefined without a weight. */
export function suggestedTargetMl(profile: Profile | null, measurements: BodyMeasurement[], settings: Settings) {
  const w = currentWeight(measurements, profile);
  if (!w) return undefined;
  return round50(toKg(w, settings.weightUnit) * ML_PER_KG);
}

/** Base daily target: manual target → suggestion → 2.5 L default. */
export function baseTargetMl(profile: Profile | null, measurements: BodyMeasurement[], settings: Settings) {
  return profile?.waterTargetMl || suggestedTargetMl(profile, measurements, settings) || DEFAULT_TARGET_ML;
}

/** Minutes of exercise logged on a date (session duration, or cardio minutes). */
export function workoutMinutesOn(date: DateKey, sessions: Session[]) {
  return sessions.filter((s) => s.date === date).reduce((a, s) => a + (sessionDuration(s) ?? 0), 0);
}

export function workoutBonusMl(date: DateKey, sessions: Session[], profile: Profile | null) {
  if (profile?.waterWorkoutBonus === false) return 0;
  return round50((workoutMinutesOn(date, sessions) / 60) * BONUS_ML_PER_HOUR);
}

export function targetForDate(date: DateKey, base: number, sessions: Session[], profile: Profile | null) {
  return base + workoutBonusMl(date, sessions, profile);
}

export const quickSizes = (profile: Profile | null) =>
  profile?.waterQuickSizes?.length === 3 && profile.waterQuickSizes.every((n) => n > 0) ? profile.waterQuickSizes : DEFAULT_QUICK_SIZES;

// ---------- Totals & progress ----------

export function totalsByDate(logs: WaterLog[]) {
  const m = new Map<DateKey, number>();
  for (const l of logs) m.set(l.date, (m.get(l.date) ?? 0) + l.amountMl);
  return m;
}

export interface WaterDay {
  date: DateKey;
  label: string;
  ml: number;
  target: number;
  met: boolean;
}

/** Last N days (oldest first) with total, target and whether it was met. */
export function waterSeries(days: number, logs: WaterLog[], base: number, sessions: Session[], profile: Profile | null): WaterDay[] {
  const totals = totalsByDate(logs);
  const today = todayKey();
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i));
    const ml = totals.get(date) ?? 0;
    const target = targetForDate(date, base, sessions, profile);
    return {
      date,
      label: fromKey(date).toLocaleDateString(undefined, days <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }),
      ml,
      target,
      met: ml >= target,
    };
  });
}

/** Consecutive days the target was met, ending today (or yesterday if today isn't met yet). */
export function waterStreak(logs: WaterLog[], base: number, sessions: Session[], profile: Profile | null) {
  const totals = totalsByDate(logs);
  const met = (d: DateKey) => (totals.get(d) ?? 0) >= targetForDate(d, base, sessions, profile);
  let d = todayKey();
  if (!met(d)) d = addDays(d, -1);
  let n = 0;
  while (met(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Days the target was met within [from, to]. */
export function daysMet(from: DateKey, to: DateKey, logs: WaterLog[], base: number, sessions: Session[], profile: Profile | null) {
  const totals = totalsByDate(logs);
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if ((totals.get(d) ?? 0) >= targetForDate(d, base, sessions, profile)) n++;
  return n;
}

/** Average ml per day over the last N days, counting only days with any water logged. */
export function averageDaily(days: number, logs: WaterLog[]) {
  const from = addDays(todayKey(), -(days - 1));
  const totals = [...totalsByDate(logs).entries()].filter(([d]) => d >= from);
  return totals.length ? totals.reduce((a, [, v]) => a + v, 0) / totals.length : 0;
}
