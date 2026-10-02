// Core data model. Everything lives in IndexedDB on this device (see src/db/db.ts).

export const MUSCLE_GROUPS = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'ABS',
  'FULL BODY',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type SessionKind = 'strength' | 'cardio';

/** ISO calendar date, e.g. "2026-10-02" (local time, no timezone). */
export type DateKey = string;

export interface SetEntry {
  reps: number;
  weight: number;
}

export interface StrengthEntry {
  id: string;
  exercise: string;
  muscleGroup: MuscleGroup;
  sets: SetEntry[];
  notes?: string;
}

export interface CardioEntry {
  id: string;
  activity: string;
  durationMin: number; // mandatory
  distance?: number; // optional, in user's distance unit
  calories?: number; // optional
  notes?: string;
}

/** One workout session on one date. Strength and cardio are kept as separate sessions. */
export interface Session {
  id: string;
  date: DateKey;
  kind: SessionKind;
  name?: string;
  notes?: string;
  strength: StrengthEntry[];
  cardio: CardioEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface CustomExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

export interface CustomCardio {
  id: string;
  name: string;
}

export interface Favorite {
  /** "strength:Bench Press" or "cardio:Running" */
  key: string;
  addedAt: number;
}

export interface Template {
  id: string;
  name: string;
  kind: SessionKind;
  builtIn?: boolean;
  strength: { exercise: string; muscleGroup: MuscleGroup; sets: number }[];
  cardio: { activity: string; durationMin: number }[];
}

export interface Settings {
  weightUnit: 'kg' | 'lb';
  distanceUnit: 'km' | 'mi';
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
}

export const DEFAULT_SETTINGS: Settings = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  weekStartsOn: 1,
};

export interface BackupFile {
  app: 'gym-diary';
  version: 1;
  exportedAt: string;
  sessions: Session[];
  customExercises: CustomExercise[];
  customCardio: CustomCardio[];
  favorites: Favorite[];
  templates: Template[];
  settings: Settings;
}
