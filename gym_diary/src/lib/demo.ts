import type { Session, StrengthEntry, MuscleGroup, WaterLog } from '../types';
import { addDays, todayKey, fromKey } from './date';
import { uid } from '../db/db';
import { cardioCategory } from '../data/cardio';

/** Generates ~10 weeks of realistic sample workouts so the dashboards can be explored. */
export function makeDemoSessions(): Session[] {
  const plan: Record<number, { name: string; ex: [string, MuscleGroup, number][] } | 'cardio' | null> = {
    1: { name: 'Push Day', ex: [['Barbell Bench Press', 'CHEST', 60], ['Overhead Press', 'SHOULDERS', 35], ['Incline Dumbbell Press', 'CHEST', 22], ['Rope Pushdown', 'TRICEPS', 25]] },
    2: 'cardio',
    3: { name: 'Pull Day', ex: [['Deadlift', 'BACK', 100], ['Lat Pulldown', 'BACK', 55], ['Barbell Row', 'BACK', 50], ['Barbell Curl', 'BICEPS', 25]] },
    4: null,
    5: { name: 'Leg Day', ex: [['Squat', 'QUADS', 80], ['Romanian Deadlift', 'HAMSTRINGS', 70], ['Leg Press', 'QUADS', 140], ['Hip Thrust', 'GLUTES', 80], ['Standing Calf Raise', 'CALVES', 60]] },
    6: 'cardio',
    0: null,
  };
  const cardio = ['Outdoor Running', 'Incline Walking', 'Outdoor Cycling', 'Rowing Machine', 'Elliptical Trainer', 'HIIT Circuit Training'];
  const out: Session[] = [];
  const today = todayKey();
  for (let back = 70; back >= 1; back--) {
    const date = addDays(today, -back);
    const p = plan[fromKey(date).getDay()];
    if (!p || Math.random() < 0.12) continue; // skip some days for realism
    const week = Math.floor((70 - back) / 7);
    const now = fromKey(date).getTime() + 18 * 3600_000;
    if (p === 'cardio') {
      const activity = cardio[(back * 7) % cardio.length];
      const dur = 20 + Math.round(Math.random() * 25);
      out.push({
        id: uid(), date, kind: 'cardio', strength: [], createdAt: now, updatedAt: now,
        cardio: [
          {
            id: uid(),
            activity,
            category: cardioCategory(activity),
            durationMin: dur,
            distance: ['Outdoor Running', 'Outdoor Cycling', 'Rowing Machine'].includes(activity) ? Math.round(dur * (activity === 'Outdoor Cycling' ? 0.45 : 0.17) * 10) / 10 : undefined,
            calories: dur * (9 + Math.round(Math.random() * 4)),
            avgHeartRate: 128 + Math.round(Math.random() * 30),
          },
        ],
      });
    } else {
      const strength: StrengthEntry[] = p.ex.map(([exercise, muscleGroup, base]) => {
        const w = Math.round((base * (1 + week * 0.02)) / 2.5) * 2.5;
        return { id: uid(), exercise, muscleGroup, sets: [ { reps: 10, weight: w - 5 > 0 ? w - 5 : w }, { reps: 8, weight: w }, { reps: 8, weight: w }, { reps: 6, weight: w + 2.5 } ] };
      });
      out.push({ id: uid(), date, kind: 'strength', name: p.name, durationMin: 50 + Math.round(Math.random() * 25), strength, cardio: [], createdAt: now, updatedAt: now });
    }
  }
  return out;
}

/** ~5 weeks of sample water logs (a few glasses and bottles per day, some days short of target). */
export function makeDemoWater(): WaterLog[] {
  const out: WaterLog[] = [];
  const today = todayKey();
  for (let back = 34; back >= 0; back--) {
    const date = addDays(today, -back);
    const base = fromKey(date).getTime();
    const drinks = back === 0 ? 4 : 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < drinks; i++) {
      out.push({
        id: uid(),
        date,
        amountMl: Math.random() < 0.45 ? 250 : Math.random() < 0.85 ? 500 : 750,
        loggedAt: base + (8 + i * 1.6) * 3600_000,
      });
    }
  }
  return out;
}
