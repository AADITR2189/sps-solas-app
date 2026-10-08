import type { BodyMeasurement, Profile, Settings } from '../types';
import { ACTIVITY_LEVELS } from '../types';
import { addDays, todayKey } from './date';

const LB_PER_KG = 2.20462;
export const toKg = (w: number, unit: Settings['weightUnit']) => (unit === 'lb' ? w / LB_PER_KG : w);

/** Latest logged body weight, falling back to the profile weight. */
export function currentWeight(measurements: BodyMeasurement[], profile: Profile | null): number | undefined {
  return measurements.length ? measurements[measurements.length - 1].weight : profile?.weight;
}

/**
 * Weight change: latest entry vs the first entry on/before `sinceDays` ago
 * (or the very first entry / profile weight when history is shorter).
 */
export function weightChange(measurements: BodyMeasurement[], profile: Profile | null, sinceDays?: number) {
  const cur = currentWeight(measurements, profile);
  if (cur === undefined) return undefined;
  let base: number | undefined;
  if (sinceDays !== undefined) {
    const cutoff = addDays(todayKey(), -sinceDays);
    const before = measurements.filter((m) => m.date <= cutoff);
    base = before.length ? before[before.length - 1].weight : measurements[0]?.weight;
  } else {
    base = profile?.weight ?? measurements[0]?.weight;
  }
  if (base === undefined) return undefined;
  return cur - base;
}

export function bmi(weight: number | undefined, heightCm: number | undefined, unit: Settings['weightUnit']) {
  if (!weight || !heightCm) return undefined;
  const m = heightCm / 100;
  return toKg(weight, unit) / (m * m);
}

export function bmiLabel(v: number) {
  if (v < 18.5) return 'Underweight';
  if (v < 25) return 'Healthy range';
  if (v < 30) return 'Overweight';
  return 'Obese range';
}

/** Mifflin–St Jeor resting energy, then x activity factor. Returns kcal/day. */
export function dailyCalories(profile: Profile | null, weight: number | undefined, unit: Settings['weightUnit']) {
  if (!profile?.age || !profile.heightCm || !weight) return undefined;
  const kg = toKg(weight, unit);
  const base = 10 * kg + 6.25 * profile.heightCm - 5 * profile.age;
  const bmr = profile.gender === 'Male' ? base + 5 : profile.gender === 'Female' ? base - 161 : base - 78;
  const factor = ACTIVITY_LEVELS.find((a) => a.id === profile.activityLevel)?.factor ?? 1.375;
  return { bmr: Math.round(bmr), maintenance: Math.round(bmr * factor) };
}
