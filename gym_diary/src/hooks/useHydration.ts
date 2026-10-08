import { useMemo } from 'react';
import { useData } from './useData';
import type { DateKey } from '../types';
import { baseTargetMl, quickSizes, targetForDate, workoutBonusMl } from '../lib/water';
import { todayKey } from '../lib/date';

/** Hydration numbers for one day (defaults to today). */
export function useHydration(date: DateKey = todayKey()) {
  const { water, sessions, profile, measurements, settings } = useData();
  return useMemo(() => {
    const base = baseTargetMl(profile, measurements, settings);
    const target = targetForDate(date, base, sessions, profile);
    const logs = water.filter((w) => w.date === date).sort((a, b) => a.loggedAt - b.loggedAt);
    const total = logs.reduce((a, w) => a + w.amountMl, 0);
    return {
      base,
      target,
      bonus: workoutBonusMl(date, sessions, profile),
      logs,
      total,
      pct: target ? Math.min(100, Math.round((total / target) * 100)) : 0,
      remaining: Math.max(0, target - total),
      sizes: quickSizes(profile),
    };
  }, [date, water, sessions, profile, measurements, settings]);
}
