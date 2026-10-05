import type { EquipmentChoice, Level, MuscleGroup } from '../types';
import type { Region } from './muscles';

/**
 * One-tap template library. Every template definition below is generated in three equipment versions:
 *   machine = machines, cables and Smith machine
 *   free    = barbell, dumbbell, EZ bar, kettlebell, plates (not attached to a machine)
 *   mixed   = best of both, plus bodyweight moves (pull-ups, dips, planks…)
 * Exercise count, sets, reps and rest are sized from the user's level and goal (see lib/templates.ts).
 */

export type PoolId =
  | 'chest'
  | 'back'
  | 'rear'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core';

export interface Pool {
  label: string;
  group: MuscleGroup;
  /** Heat-map regions this pool trains (used for recommendations). */
  regions: Region[];
  /** Exercises per equipment version, best / compound first. */
  machine: string[];
  free: string[];
  mixed: string[];
}

export const POOLS: Record<PoolId, Pool> = {
  chest: {
    label: 'Chest',
    group: 'CHEST',
    regions: ['chest'],
    machine: ['Machine Chest Press', 'Smith Machine Press', 'Pec Deck', 'Cable Fly', 'Single Arm Cable Press'],
    free: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Bench Press', 'Incline Bench Press', 'Chest Fly', 'Decline Dumbbell Press', 'Dumbbell Pullover'],
    mixed: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Machine Chest Press', 'Push Ups', 'Pec Deck'],
  },
  back: {
    label: 'Back',
    group: 'BACK',
    regions: ['lats', 'traps'],
    machine: ['Lat Pulldown', 'Seated Cable Row', 'Machine Row', 'Close Grip Pulldown', 'Straight Arm Pulldown', 'Wide Grip Pulldown'],
    free: ['Barbell Row', 'Dumbbell Row', 'T-Bar Row', 'Deadlift', 'Meadows Row', 'Rack Pull'],
    mixed: ['Pull Ups', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'Dumbbell Row', 'Straight Arm Pulldown'],
  },
  rear: {
    label: 'Rear delts',
    group: 'SHOULDERS',
    regions: ['rearDelts'],
    machine: ['Reverse Pec Deck', 'Face Pull', 'Cable Row to Neck'],
    free: ['Rear Delt Fly', 'Upright Row'],
    mixed: ['Face Pull', 'Rear Delt Fly', 'Reverse Pec Deck'],
  },
  shoulders: {
    label: 'Shoulders',
    group: 'SHOULDERS',
    regions: ['frontDelts', 'sideDelts'],
    machine: ['Machine Shoulder Press', 'Cable Lateral Raise', 'Machine Lateral Raise', 'Reverse Pec Deck', 'Face Pull'],
    free: ['Overhead Press', 'Seated Dumbbell Press', 'Lateral Raise', 'Arnold Press', 'Front Raise', 'Rear Delt Fly', 'Upright Row'],
    mixed: ['Overhead Press', 'Lateral Raise', 'Machine Shoulder Press', 'Cable Lateral Raise', 'Face Pull', 'Arnold Press'],
  },
  biceps: {
    label: 'Biceps',
    group: 'BICEPS',
    regions: ['biceps'],
    machine: ['Cable Curl', 'Machine Curl', 'Bayesian Curl'],
    free: ['Barbell Curl', 'Incline Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'EZ Bar Curl', 'Concentration Curl', 'Spider Curl'],
    mixed: ['Barbell Curl', 'Cable Curl', 'Hammer Curl', 'Bayesian Curl', 'Incline Dumbbell Curl'],
  },
  triceps: {
    label: 'Triceps',
    group: 'TRICEPS',
    regions: ['triceps'],
    machine: ['Rope Pushdown', 'Cable Extension', 'Tricep Pushdown', 'Single Arm Pushdown'],
    free: ['Close Grip Bench Press', 'Skull Crushers', 'Overhead Extension', 'JM Press', 'Kickbacks'],
    mixed: ['Rope Pushdown', 'Overhead Extension', 'Skull Crushers', 'Dips', 'Close Grip Bench Press', 'Single Arm Pushdown'],
  },
  forearms: {
    label: 'Forearms',
    group: 'FOREARMS',
    regions: ['forearms'],
    machine: ['Cable Wrist Curl', 'Cable Reverse Curl', 'Cable Rope Hammer Curl'],
    free: ['Wrist Curl', 'Reverse Wrist Curl', 'Farmer Walk', 'Reverse Curl', 'Wrist Roller', 'Plate Pinch', 'Hammer Curl'],
    mixed: ['Farmer Walk', 'Wrist Curl', 'Cable Reverse Curl', 'Reverse Wrist Curl', 'Wrist Roller'],
  },
  quads: {
    label: 'Quads',
    group: 'QUADS',
    regions: ['quads'],
    machine: ['Leg Press', 'Hack Squat', 'Leg Extension'],
    free: ['Squat', 'Front Squat', 'Bulgarian Split Squat', 'Goblet Squat', 'Walking Lunges', 'Step Ups'],
    mixed: ['Squat', 'Leg Press', 'Bulgarian Split Squat', 'Leg Extension', 'Hack Squat', 'Walking Lunges'],
  },
  hamstrings: {
    label: 'Hamstrings',
    group: 'HAMSTRINGS',
    regions: ['hamstrings'],
    machine: ['Hamstring Curl', 'Seated Leg Curl', 'Machine Back Extension'],
    free: ['Romanian Deadlift', 'Stiff Leg Deadlift', 'Good Morning', 'Kettlebell Swings'],
    mixed: ['Romanian Deadlift', 'Hamstring Curl', 'Seated Leg Curl', 'Nordic Curl', 'Good Morning'],
  },
  glutes: {
    label: 'Glutes',
    group: 'GLUTES',
    regions: ['glutes'],
    machine: ['Hip Thrust Machine', 'Glute Kickback Machine', 'Cable Kickbacks', 'Hip Abduction Machine'],
    free: ['Hip Thrust', 'Bulgarian Split Squat', 'Sumo Deadlift', 'Kettlebell Swings', 'Walking Lunges'],
    mixed: ['Hip Thrust', 'Bulgarian Split Squat', 'Cable Kickbacks', 'Hip Abduction Machine', 'Glute Bridge'],
  },
  calves: {
    label: 'Calves',
    group: 'CALVES',
    regions: ['calves'],
    machine: ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise', 'Donkey Calf Raise'],
    free: ['Dumbbell Calf Raise', 'Barbell Calf Raise'],
    mixed: ['Standing Calf Raise', 'Seated Calf Raise', 'Dumbbell Calf Raise'],
  },
  core: {
    label: 'Core',
    group: 'ABS',
    regions: ['abs', 'obliques'],
    machine: ['Cable Crunches', 'Ab Crunch Machine', 'Cable Woodchopper'],
    free: ['Weighted Decline Sit-Up', 'Weighted Russian Twist', 'Dumbbell Side Bend'],
    mixed: ['Hanging Leg Raise', 'Cable Crunches', 'Plank', 'Ab Rollout', 'Russian Twists', 'Cable Woodchopper'],
  },
};

/** Cardio blocks: machine cardio for the Machine version, no-machine cardio for Free weights. */
export const CARDIO_POOL: Record<EquipmentChoice, string[]> = {
  machine: ['Treadmill Running', 'Stationary Bike', 'Rowing Machine', 'Elliptical Trainer', 'Stair Climber'],
  free: ['Outdoor Running', 'Basic Jump Rope', 'HIIT Circuit Training'],
  mixed: ['Incline Walking', 'Outdoor Running', 'Rowing Machine'],
};

/** Big multi-joint lifts. With a strength goal these use heavy 4–6 rep sets. */
export const COMPOUNDS = new Set([
  'Barbell Bench Press',
  'Incline Bench Press',
  'Dumbbell Bench Press',
  'Incline Dumbbell Press',
  'Decline Dumbbell Press',
  'Machine Chest Press',
  'Smith Machine Press',
  'Barbell Row',
  'Dumbbell Row',
  'T-Bar Row',
  'Meadows Row',
  'Machine Row',
  'Seated Cable Row',
  'Lat Pulldown',
  'Pull Ups',
  'Deadlift',
  'Rack Pull',
  'Overhead Press',
  'Seated Dumbbell Press',
  'Machine Shoulder Press',
  'Arnold Press',
  'Close Grip Bench Press',
  'Dips',
  'JM Press',
  'Squat',
  'Front Squat',
  'Hack Squat',
  'Leg Press',
  'Bulgarian Split Squat',
  'Romanian Deadlift',
  'Stiff Leg Deadlift',
  'Good Morning',
  'Hip Thrust',
  'Hip Thrust Machine',
  'Sumo Deadlift',
]);

export type TemplateCategory = 'classic' | 'single' | 'two' | 'three';
export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  classic: 'Classic',
  single: 'Single muscle',
  two: 'Two muscles',
  three: 'Three muscles',
};

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  /** Muscle pools with relative weights: more weight = more exercises. Order = workout order. */
  parts: [PoolId, number][];
  /** Ends with a cardio block (kept for every equipment version). */
  cardio?: boolean;
  /** A cardio-only session (Cardio Day). */
  cardioOnly?: boolean;
  /** Old built-in template id this replaces, so saved links keep working. */
  legacyId?: string;
}

const d = (id: string, name: string, category: TemplateCategory, parts: [PoolId, number][], extra: Partial<TemplateDef> = {}): TemplateDef => ({
  id,
  name,
  category,
  parts,
  ...extra,
});

export const TEMPLATE_DEFS: TemplateDef[] = [
  // Classic splits (these replace the original built-in templates)
  d('push', 'Push Day', 'classic', [['chest', 2], ['shoulders', 1.5], ['triceps', 1.5]], { legacyId: 'tpl-push' }),
  d('pull', 'Pull Day', 'classic', [['back', 2.5], ['rear', 1], ['biceps', 1.5]], { legacyId: 'tpl-pull' }),
  d('legs', 'Leg Day', 'classic', [['quads', 2], ['hamstrings', 1.5], ['glutes', 1], ['calves', 1]], { legacyId: 'tpl-legs' }),
  d('upper', 'Upper Body', 'classic', [['chest', 1.5], ['back', 1.5], ['shoulders', 1], ['biceps', 0.75], ['triceps', 0.75]], { legacyId: 'tpl-upper' }),
  d('lower', 'Lower Body', 'classic', [['quads', 1.5], ['hamstrings', 1.5], ['glutes', 1], ['calves', 0.75], ['core', 0.75]], { legacyId: 'tpl-lower' }),
  d('full', 'Full Body', 'classic', [['quads', 1], ['chest', 1], ['back', 1], ['shoulders', 0.75], ['hamstrings', 0.75], ['core', 0.5]], { legacyId: 'tpl-full' }),
  d('cardio-day', 'Cardio Day', 'classic', [], { cardioOnly: true, legacyId: 'tpl-cardio' }),

  // Single muscle
  d('chest', 'Chest', 'single', [['chest', 1]]),
  d('back', 'Back', 'single', [['back', 1]]),
  d('shoulders', 'Shoulders', 'single', [['shoulders', 1]]),
  d('biceps', 'Biceps', 'single', [['biceps', 1]]),
  d('triceps', 'Triceps', 'single', [['triceps', 1]]),
  d('forearms', 'Forearms', 'single', [['forearms', 1]]),
  d('quads', 'Quads', 'single', [['quads', 1]]),
  d('hamstrings', 'Hamstrings', 'single', [['hamstrings', 1]]),
  d('glutes', 'Glutes', 'single', [['glutes', 1]]),
  d('calves', 'Calves', 'single', [['calves', 1]]),
  d('core', 'Core', 'single', [['core', 1]]),

  // Two muscles
  d('chest-triceps', 'Chest + Triceps', 'two', [['chest', 2], ['triceps', 1.3]]),
  d('back-biceps', 'Back + Biceps', 'two', [['back', 2], ['biceps', 1.3]]),
  d('chest-back', 'Chest + Back', 'two', [['chest', 1], ['back', 1]]),
  d('shoulders-arms', 'Shoulders + Arms', 'two', [['shoulders', 1.5], ['biceps', 1], ['triceps', 1]]),
  d('biceps-triceps', 'Biceps + Triceps', 'two', [['biceps', 1], ['triceps', 1]]),
  d('quads-calves', 'Quads + Calves', 'two', [['quads', 2], ['calves', 1]]),
  d('hamstrings-glutes', 'Hamstrings + Glutes', 'two', [['hamstrings', 1], ['glutes', 1]]),
  d('chest-shoulders', 'Chest + Shoulders', 'two', [['chest', 1.5], ['shoulders', 1]]),
  d('back-rear', 'Back + Rear Delts', 'two', [['back', 2], ['rear', 1]]),
  d('core-cardio', 'Core + Cardio', 'two', [['core', 1]], { cardio: true }),

  // Three muscles
  d('chest-shoulders-triceps', 'Chest + Shoulders + Triceps', 'three', [['chest', 1.5], ['shoulders', 1], ['triceps', 1]]),
  d('back-biceps-rear', 'Back + Biceps + Rear Delts', 'three', [['back', 2], ['biceps', 1], ['rear', 0.75]]),
  d('legs-shoulders-core', 'Legs + Shoulders + Core', 'three', [['quads', 1], ['hamstrings', 0.75], ['shoulders', 1], ['core', 0.75]]),
  d('chest-back-arms', 'Chest + Back + Arms', 'three', [['chest', 1], ['back', 1], ['biceps', 0.6], ['triceps', 0.6]]),
  d('quads-hamstrings-calves', 'Quads + Hamstrings + Calves', 'three', [['quads', 1.5], ['hamstrings', 1.25], ['calves', 0.75]]),
  d('shoulders-biceps-triceps', 'Shoulders + Biceps + Triceps', 'three', [['shoulders', 1.2], ['biceps', 1], ['triceps', 1]]),
  d('full-upper', 'Chest + Back + Shoulders', 'three', [['chest', 1], ['back', 1], ['shoulders', 1]]),
  d('core-glutes-cardio', 'Core + Glutes + Cardio', 'three', [['glutes', 1], ['core', 1]], { cardio: true }),
];

export const EQUIPMENT_CHOICES: { id: EquipmentChoice; label: string; hint: string }[] = [
  { id: 'machine', label: 'Machine', hint: 'Machines, cables, Smith' },
  { id: 'free', label: 'Free weights', hint: 'Barbell, dumbbell, EZ bar, kettlebell' },
  { id: 'mixed', label: 'Mixed', hint: 'Both, plus bodyweight' },
];

export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner', hint: 'Under 6 months' },
  { id: 'intermediate', label: 'Intermediate', hint: '6 months – 2 years' },
  { id: 'advanced', label: 'Advanced', hint: '2+ years' },
];
export const levelLabel = (l: Level) => LEVELS.find((x) => x.id === l)!.label;
