import { createContext, useContext, useEffect, useMemo, useState, createElement, type ReactNode } from 'react';
import * as db from '../db/db';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { BUILT_IN_TEMPLATES, CARDIO_ACTIVITIES } from '../data/cardio';
import type { CustomCardio, CustomExercise, Favorite, MuscleGroup, Session, Settings, Template } from '../types';
import { DEFAULT_SETTINGS, MUSCLE_GROUPS } from '../types';

interface DataState {
  ready: boolean;
  sessions: Session[];
  customExercises: CustomExercise[];
  customCardio: CustomCardio[];
  favorites: Favorite[];
  userTemplates: Template[];
  settings: Settings;
}

interface DataCtx extends DataState {
  /** Built-in + custom exercises per muscle group. */
  library: Record<MuscleGroup, string[]>;
  cardioActivities: string[];
  templates: Template[];
  favoriteSet: Set<string>;
}

const Ctx = createContext<DataCtx | null>(null);

/** Loads everything from IndexedDB once and re-loads after every write (single user, small data). */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    ready: false,
    sessions: [],
    customExercises: [],
    customCardio: [],
    favorites: [],
    userTemplates: [],
    settings: DEFAULT_SETTINGS,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [sessions, customExercises, customCardio, favorites, userTemplates, settings] = await Promise.all([
        db.getAllSessions(),
        db.getCustomExercises(),
        db.getCustomCardio(),
        db.getFavorites(),
        db.getUserTemplates(),
        db.getSettings(),
      ]);
      if (alive) setState({ ready: true, sessions, customExercises, customCardio, favorites, userTemplates, settings });
    };
    load();
    db.requestPersistentStorage();
    const unsub = db.subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const value = useMemo<DataCtx>(() => {
    const library = {} as Record<MuscleGroup, string[]>;
    for (const g of MUSCLE_GROUPS) {
      const custom = state.customExercises.filter((e) => e.muscleGroup === g).map((e) => e.name);
      library[g] = [...new Set([...EXERCISE_LIBRARY[g], ...custom])];
    }
    const cardioActivities = [...new Set([...CARDIO_ACTIVITIES, ...state.customCardio.map((c) => c.name)])];
    return {
      ...state,
      library,
      cardioActivities,
      templates: [...BUILT_IN_TEMPLATES, ...state.userTemplates],
      favoriteSet: new Set(state.favorites.map((f) => f.key)),
    };
  }, [state]);

  return createElement(Ctx.Provider, { value }, children);
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be used inside DataProvider');
  return v;
}
