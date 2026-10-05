import type { Equipment, MuscleGroup } from '../types';

/**
 * Heat-map regions: the 12 muscle groups split a little finer so the body map is accurate.
 * Every region rolls up to one of the app's muscle groups.
 */
export const REGIONS = [
  { id: 'chest', name: 'Chest', group: 'CHEST' },
  { id: 'frontDelts', name: 'Front delts', group: 'SHOULDERS' },
  { id: 'sideDelts', name: 'Side delts', group: 'SHOULDERS' },
  { id: 'rearDelts', name: 'Rear delts', group: 'SHOULDERS' },
  { id: 'biceps', name: 'Biceps', group: 'BICEPS' },
  { id: 'triceps', name: 'Triceps', group: 'TRICEPS' },
  { id: 'forearms', name: 'Forearms', group: 'FOREARMS' },
  { id: 'traps', name: 'Traps', group: 'BACK' },
  { id: 'lats', name: 'Lats', group: 'BACK' },
  { id: 'lowerBack', name: 'Lower back', group: 'BACK' },
  { id: 'abs', name: 'Abs', group: 'ABS' },
  { id: 'obliques', name: 'Obliques', group: 'ABS' },
  { id: 'glutes', name: 'Glutes', group: 'GLUTES' },
  { id: 'abductors', name: 'Hip abductors', group: 'GLUTES' },
  { id: 'quads', name: 'Quads', group: 'QUADS' },
  { id: 'hamstrings', name: 'Hamstrings', group: 'HAMSTRINGS' },
  { id: 'adductors', name: 'Adductors', group: 'QUADS' },
  { id: 'calves', name: 'Calves', group: 'CALVES' },
] as const satisfies readonly { id: string; name: string; group: MuscleGroup }[];

export type Region = (typeof REGIONS)[number]['id'];
export const regionInfo = (r: Region) => REGIONS.find((x) => x.id === r)!;

/** Which side of the body a region is drawn on. */
export const FRONT_REGIONS: Region[] = ['chest', 'frontDelts', 'sideDelts', 'biceps', 'forearms', 'traps', 'abs', 'obliques', 'abductors', 'quads', 'adductors', 'calves'];
export const BACK_REGIONS: Region[] = ['traps', 'rearDelts', 'sideDelts', 'triceps', 'forearms', 'lats', 'lowerBack', 'glutes', 'abductors', 'hamstrings', 'adductors', 'calves'];

export interface ExerciseMeta {
  equipment: Equipment;
  primary: Region[];
  secondary: Region[];
  /** Bodyweight exercises: share of body weight moved per rep (used for the heat map only). */
  bw?: number;
}

const M = 'machine' as const;
const F = 'free' as const;
const B = 'bodyweight' as const;
const m = (equipment: Equipment, primary: Region[], secondary: Region[] = [], bw?: number): ExerciseMeta => ({ equipment, primary, secondary, bw });

/**
 * Equipment: machine = machines, cables and Smith machine; free = loose weights (barbell, dumbbell,
 * EZ bar, kettlebell, plates); bodyweight = no external weight.
 */
export const EXERCISE_META: Record<string, ExerciseMeta> = {
  // Chest
  'Barbell Bench Press': m(F, ['chest'], ['frontDelts', 'triceps']),
  'Incline Bench Press': m(F, ['chest', 'frontDelts'], ['triceps']),
  'Decline Bench Press': m(F, ['chest'], ['triceps', 'frontDelts']),
  'Dumbbell Bench Press': m(F, ['chest'], ['frontDelts', 'triceps']),
  'Incline Dumbbell Press': m(F, ['chest', 'frontDelts'], ['triceps']),
  'Decline Dumbbell Press': m(F, ['chest'], ['triceps']),
  'Chest Fly': m(F, ['chest'], ['frontDelts']),
  'Cable Fly': m(M, ['chest'], ['frontDelts']),
  'Pec Deck': m(M, ['chest'], ['frontDelts']),
  'Push Ups': m(B, ['chest'], ['triceps', 'frontDelts', 'abs'], 0.65),
  'Machine Chest Press': m(M, ['chest'], ['triceps', 'frontDelts']),
  'Smith Machine Press': m(M, ['chest'], ['frontDelts', 'triceps']),
  'Single Arm Cable Press': m(M, ['chest'], ['triceps', 'obliques', 'frontDelts']),
  'Landmine Press': m(F, ['frontDelts', 'chest'], ['triceps']),
  'Dumbbell Pullover': m(F, ['chest', 'lats'], ['triceps']),
  // Back
  'Pull Ups': m(B, ['lats'], ['biceps', 'rearDelts', 'forearms'], 1),
  'Chin Ups': m(B, ['lats', 'biceps'], ['rearDelts', 'forearms'], 1),
  'Lat Pulldown': m(M, ['lats'], ['biceps', 'rearDelts']),
  'Wide Grip Pulldown': m(M, ['lats'], ['rearDelts', 'biceps']),
  'Close Grip Pulldown': m(M, ['lats'], ['biceps']),
  'Seated Cable Row': m(M, ['lats', 'traps'], ['biceps', 'rearDelts']),
  'Barbell Row': m(F, ['lats', 'traps'], ['biceps', 'rearDelts', 'lowerBack']),
  'T-Bar Row': m(F, ['lats', 'traps'], ['biceps', 'rearDelts', 'lowerBack']),
  'Dumbbell Row': m(F, ['lats'], ['biceps', 'rearDelts']),
  'Machine Row': m(M, ['lats', 'traps'], ['biceps', 'rearDelts']),
  Deadlift: m(F, ['lowerBack', 'glutes', 'hamstrings'], ['traps', 'lats', 'forearms', 'quads']),
  'Rack Pull': m(F, ['lowerBack', 'traps'], ['glutes', 'hamstrings', 'forearms']),
  'Straight Arm Pulldown': m(M, ['lats'], ['triceps']),
  'Reverse Grip Pulldown': m(M, ['lats'], ['biceps']),
  'Meadows Row': m(F, ['lats'], ['rearDelts', 'biceps', 'traps']),
  'Cable Row to Neck': m(M, ['rearDelts', 'traps'], ['biceps']),
  // Shoulders
  'Overhead Press': m(F, ['frontDelts'], ['sideDelts', 'triceps', 'traps']),
  'Seated Dumbbell Press': m(F, ['frontDelts'], ['sideDelts', 'triceps']),
  'Arnold Press': m(F, ['frontDelts', 'sideDelts'], ['triceps']),
  'Lateral Raise': m(F, ['sideDelts'], ['traps']),
  'Front Raise': m(F, ['frontDelts'], ['sideDelts']),
  'Rear Delt Fly': m(F, ['rearDelts'], ['traps']),
  'Face Pull': m(M, ['rearDelts'], ['traps', 'sideDelts']),
  'Upright Row': m(F, ['sideDelts', 'traps'], ['frontDelts', 'biceps']),
  'Machine Shoulder Press': m(M, ['frontDelts'], ['sideDelts', 'triceps']),
  'Cable Lateral Raise': m(M, ['sideDelts']),
  'Machine Lateral Raise': m(M, ['sideDelts']),
  'Reverse Pec Deck': m(M, ['rearDelts'], ['traps']),
  // Biceps
  'Barbell Curl': m(F, ['biceps'], ['forearms']),
  'EZ Bar Curl': m(F, ['biceps'], ['forearms']),
  'Dumbbell Curl': m(F, ['biceps'], ['forearms']),
  'Alternating Curl': m(F, ['biceps'], ['forearms']),
  'Concentration Curl': m(F, ['biceps']),
  'Hammer Curl': m(F, ['biceps', 'forearms']),
  'Incline Dumbbell Curl': m(F, ['biceps']),
  'Cable Curl': m(M, ['biceps'], ['forearms']),
  'Preacher Curl': m(F, ['biceps']),
  'Bayesian Curl': m(M, ['biceps']),
  'Spider Curl': m(F, ['biceps']),
  'Machine Curl': m(M, ['biceps']),
  // Triceps
  'Tricep Pushdown': m(M, ['triceps']),
  'Rope Pushdown': m(M, ['triceps']),
  'Overhead Extension': m(F, ['triceps']),
  'Skull Crushers': m(F, ['triceps']),
  'Close Grip Bench Press': m(F, ['triceps', 'chest'], ['frontDelts']),
  Dips: m(B, ['triceps', 'chest'], ['frontDelts'], 1),
  'Cable Extension': m(M, ['triceps']),
  Kickbacks: m(F, ['triceps']),
  'Single Arm Pushdown': m(M, ['triceps']),
  'Bench Dips': m(B, ['triceps'], ['frontDelts', 'chest'], 0.6),
  'JM Press': m(F, ['triceps'], ['chest']),
  // Forearms
  'Wrist Curl': m(F, ['forearms']),
  'Reverse Wrist Curl': m(F, ['forearms']),
  'Farmer Walk': m(F, ['forearms', 'traps'], ['abs', 'obliques']),
  'Plate Pinch': m(F, ['forearms']),
  'Reverse Curl': m(F, ['forearms', 'biceps']),
  'Wrist Roller': m(F, ['forearms'], ['frontDelts']),
  'Cable Wrist Curl': m(M, ['forearms']),
  'Cable Reverse Curl': m(M, ['forearms', 'biceps']),
  'Cable Rope Hammer Curl': m(M, ['forearms', 'biceps']),
  // Quads
  Squat: m(F, ['quads', 'glutes'], ['hamstrings', 'lowerBack', 'abs']),
  'Front Squat': m(F, ['quads'], ['glutes', 'abs']),
  'Hack Squat': m(M, ['quads'], ['glutes']),
  'Leg Press': m(M, ['quads', 'glutes'], ['hamstrings', 'adductors']),
  'Bulgarian Split Squat': m(F, ['quads', 'glutes'], ['hamstrings', 'adductors']),
  'Walking Lunges': m(F, ['quads', 'glutes'], ['hamstrings', 'adductors', 'calves']),
  'Leg Extension': m(M, ['quads']),
  'Goblet Squat': m(F, ['quads', 'glutes'], ['abs', 'adductors']),
  'Step Ups': m(F, ['quads', 'glutes'], ['hamstrings', 'calves']),
  // Hamstrings
  'Romanian Deadlift': m(F, ['hamstrings', 'glutes'], ['lowerBack', 'forearms']),
  'Stiff Leg Deadlift': m(F, ['hamstrings'], ['glutes', 'lowerBack']),
  'Good Morning': m(F, ['hamstrings', 'lowerBack'], ['glutes']),
  'Hamstring Curl': m(M, ['hamstrings'], ['calves']),
  'Seated Leg Curl': m(M, ['hamstrings']),
  'Nordic Curl': m(B, ['hamstrings'], [], 0.6),
  'Glute Ham Raise': m(B, ['hamstrings', 'glutes'], ['lowerBack'], 0.6),
  'Machine Back Extension': m(M, ['lowerBack'], ['glutes', 'hamstrings']),
  // Glutes
  'Hip Thrust': m(F, ['glutes'], ['hamstrings', 'adductors']),
  'Glute Bridge': m(B, ['glutes'], ['hamstrings'], 0.5),
  'Cable Kickbacks': m(M, ['glutes'], ['hamstrings']),
  'Sumo Deadlift': m(F, ['glutes', 'adductors', 'quads'], ['hamstrings', 'lowerBack', 'traps']),
  'Hip Thrust Machine': m(M, ['glutes'], ['hamstrings']),
  'Hip Abduction Machine': m(M, ['abductors', 'glutes']),
  'Glute Kickback Machine': m(M, ['glutes'], ['hamstrings']),
  // Calves
  'Standing Calf Raise': m(M, ['calves']),
  'Seated Calf Raise': m(M, ['calves']),
  'Leg Press Calf Raise': m(M, ['calves']),
  'Donkey Calf Raise': m(M, ['calves']),
  'Dumbbell Calf Raise': m(F, ['calves']),
  'Barbell Calf Raise': m(F, ['calves']),
  // Core
  Crunches: m(B, ['abs'], [], 0.3),
  'Cable Crunches': m(M, ['abs'], ['obliques']),
  Plank: m(B, ['abs'], ['obliques', 'lowerBack'], 0.05),
  'Side Plank': m(B, ['obliques'], ['abs'], 0.05),
  'Hanging Leg Raise': m(B, ['abs'], ['obliques', 'forearms'], 0.35),
  'Russian Twists': m(B, ['obliques'], ['abs'], 0.2),
  'Ab Rollout': m(B, ['abs'], ['obliques', 'lats'], 0.4),
  'Decline Sit-Up': m(B, ['abs'], ['obliques'], 0.35),
  'Mountain Climbers': m(B, ['abs'], ['quads', 'frontDelts'], 0.15),
  'Reverse Crunch': m(B, ['abs'], [], 0.25),
  'Bicycle Crunch': m(B, ['obliques', 'abs'], [], 0.2),
  'Dumbbell Side Bend': m(F, ['obliques']),
  'Weighted Russian Twist': m(F, ['obliques'], ['abs']),
  'Weighted Decline Sit-Up': m(F, ['abs'], ['obliques']),
  'Ab Crunch Machine': m(M, ['abs']),
  'Cable Woodchopper': m(M, ['obliques'], ['abs', 'frontDelts']),
  // Full body
  'Clean and Press': m(F, ['frontDelts', 'glutes', 'quads'], ['traps', 'triceps', 'hamstrings', 'lowerBack']),
  Thrusters: m(F, ['quads', 'frontDelts'], ['glutes', 'triceps', 'abs']),
  'Kettlebell Swings': m(F, ['glutes', 'hamstrings'], ['lowerBack', 'frontDelts', 'abs']),
  Burpees: m(B, ['quads', 'chest'], ['frontDelts', 'triceps', 'abs'], 0.5),
  Snatch: m(F, ['traps', 'glutes', 'quads'], ['frontDelts', 'hamstrings', 'lowerBack']),
  'Turkish Get Up': m(F, ['frontDelts', 'abs'], ['obliques', 'glutes', 'traps']),
};

/** Fallback regions for custom exercises, by the muscle group they were created under. */
const GROUP_FALLBACK: Record<MuscleGroup, Region[]> = {
  CHEST: ['chest'],
  BACK: ['lats', 'traps'],
  SHOULDERS: ['frontDelts', 'sideDelts'],
  BICEPS: ['biceps'],
  TRICEPS: ['triceps'],
  FOREARMS: ['forearms'],
  QUADS: ['quads'],
  HAMSTRINGS: ['hamstrings'],
  GLUTES: ['glutes'],
  CALVES: ['calves'],
  ABS: ['abs', 'obliques'],
  'FULL BODY': ['quads', 'glutes', 'chest', 'lats'],
};

/** Muscle + equipment info for any exercise (custom ones fall back to their muscle group). */
export function exerciseMeta(name: string, group: MuscleGroup): ExerciseMeta & { known: boolean } {
  const meta = EXERCISE_META[name];
  if (meta) return { ...meta, known: true };
  return { equipment: 'free', primary: GROUP_FALLBACK[group], secondary: [], known: false };
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = { machine: 'Machine', free: 'Free weights', bodyweight: 'Bodyweight' };
