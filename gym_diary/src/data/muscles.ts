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
  // More chest
  'Incline Push Ups': m(B, ['chest'], ['triceps', 'frontDelts'], 0.45),
  'Decline Push Ups': m(B, ['chest', 'frontDelts'], ['triceps'], 0.75),
  'Wide Push Ups': m(B, ['chest'], ['frontDelts', 'triceps'], 0.65),
  'Chest Dips': m(B, ['chest', 'triceps'], ['frontDelts'], 1),
  'Cable Crossover': m(M, ['chest'], ['frontDelts']),
  'Low to High Cable Fly': m(M, ['chest', 'frontDelts'], []),
  'High to Low Cable Fly': m(M, ['chest'], ['frontDelts']),
  'Incline Cable Fly': m(M, ['chest', 'frontDelts'], []),
  'Incline Machine Press': m(M, ['chest', 'frontDelts'], ['triceps']),
  'Incline Smith Machine Press': m(M, ['chest', 'frontDelts'], ['triceps']),
  'Incline Dumbbell Fly': m(F, ['chest'], ['frontDelts']),
  'Floor Press': m(F, ['chest', 'triceps'], ['frontDelts']),
  'Svend Press': m(F, ['chest'], ['frontDelts']),
  // More back
  'Neutral Grip Pull Ups': m(B, ['lats'], ['biceps', 'forearms', 'rearDelts'], 1),
  'Assisted Pull Up': m(M, ['lats'], ['biceps', 'rearDelts']),
  'Inverted Row': m(B, ['lats', 'traps'], ['biceps', 'rearDelts'], 0.6),
  'Pendlay Row': m(F, ['lats', 'traps'], ['rearDelts', 'biceps', 'lowerBack']),
  'Chest Supported Row': m(F, ['lats', 'traps'], ['rearDelts', 'biceps']),
  'Seal Row': m(F, ['lats', 'traps'], ['rearDelts', 'biceps']),
  'Kettlebell Row': m(F, ['lats'], ['biceps', 'rearDelts']),
  'Single Arm Lat Pulldown': m(M, ['lats'], ['biceps']),
  'Single Arm Cable Row': m(M, ['lats'], ['biceps', 'rearDelts', 'obliques']),
  'Pullover Machine': m(M, ['lats'], ['chest', 'triceps']),
  'Barbell Shrug': m(F, ['traps'], ['forearms']),
  'Dumbbell Shrug': m(F, ['traps'], ['forearms']),
  'Smith Machine Shrug': m(M, ['traps'], ['forearms']),
  'Cable Shrug': m(M, ['traps'], []),
  'Back Extension': m(B, ['lowerBack'], ['glutes', 'hamstrings'], 0.5),
  'Superman': m(B, ['lowerBack'], ['glutes', 'rearDelts'], 0.15),
  // More shoulders
  'Standing Dumbbell Press': m(F, ['frontDelts'], ['sideDelts', 'triceps', 'abs']),
  'Push Press': m(F, ['frontDelts'], ['triceps', 'quads', 'glutes', 'traps']),
  'Smith Machine Shoulder Press': m(M, ['frontDelts'], ['sideDelts', 'triceps']),
  'Cable Front Raise': m(M, ['frontDelts'], ['sideDelts']),
  'Plate Front Raise': m(F, ['frontDelts'], ['sideDelts', 'traps']),
  'Cable Rear Delt Fly': m(M, ['rearDelts'], ['traps']),
  'Bent Over Lateral Raise': m(F, ['rearDelts'], ['sideDelts', 'traps']),
  'Y Raise': m(F, ['sideDelts', 'rearDelts'], ['traps']),
  'Pike Push Ups': m(B, ['frontDelts'], ['triceps', 'chest'], 0.5),
  'Handstand Push Ups': m(B, ['frontDelts', 'triceps'], ['traps', 'sideDelts'], 1),
  'Seated Lateral Raise': m(F, ['sideDelts'], ['traps']),
  'Lu Raise': m(F, ['sideDelts', 'frontDelts'], ['traps']),
  // More biceps
  'Drag Curl': m(F, ['biceps'], ['forearms']),
  'Zottman Curl': m(F, ['biceps', 'forearms'], []),
  'Cross Body Hammer Curl': m(F, ['biceps', 'forearms'], []),
  'Dumbbell Preacher Curl': m(F, ['biceps'], []),
  'Cable Preacher Curl': m(M, ['biceps'], []),
  'High Cable Curl': m(M, ['biceps'], []),
  // More triceps
  'Diamond Push Ups': m(B, ['triceps', 'chest'], ['frontDelts'], 0.6),
  'Close Grip Push Ups': m(B, ['triceps', 'chest'], ['frontDelts'], 0.65),
  'Overhead Cable Extension': m(M, ['triceps'], []),
  'Reverse Grip Pushdown': m(M, ['triceps'], ['forearms']),
  'Machine Dips': m(M, ['triceps', 'chest'], ['frontDelts']),
  'Dumbbell Skull Crushers': m(F, ['triceps'], []),
  'Tate Press': m(F, ['triceps'], ['chest']),
  // More forearms
  'Behind the Back Wrist Curl': m(F, ['forearms'], []),
  'Suitcase Carry': m(F, ['forearms', 'obliques'], ['traps', 'abs']),
  'Dead Hang': m(B, ['forearms'], ['lats'], 0.1),
  'Hand Gripper': m(F, ['forearms'], []),
  // More quads
  'Bodyweight Squat': m(B, ['quads', 'glutes'], ['adductors'], 0.6),
  'Jump Squats': m(B, ['quads', 'glutes'], ['calves', 'hamstrings'], 0.7),
  'Smith Machine Squat': m(M, ['quads', 'glutes'], ['hamstrings', 'adductors']),
  'Pendulum Squat': m(M, ['quads'], ['glutes']),
  'Belt Squat': m(M, ['quads', 'glutes'], ['adductors']),
  'Single Leg Press': m(M, ['quads', 'glutes'], ['hamstrings']),
  'Box Squat': m(F, ['quads', 'glutes'], ['hamstrings', 'lowerBack']),
  'Lunges': m(F, ['quads', 'glutes'], ['hamstrings', 'adductors']),
  'Reverse Lunges': m(F, ['quads', 'glutes'], ['hamstrings', 'adductors']),
  'Split Squat': m(F, ['quads', 'glutes'], ['hamstrings', 'adductors']),
  'Lateral Lunge': m(F, ['quads', 'adductors'], ['glutes']),
  'Sissy Squat': m(B, ['quads'], [], 0.5),
  'Pistol Squat': m(B, ['quads', 'glutes'], ['adductors', 'abs'], 0.9),
  'Wall Sit': m(B, ['quads'], ['glutes'], 0.05),
  'Hip Adduction Machine': m(M, ['adductors'], []),
  'Cable Hip Adduction': m(M, ['adductors'], []),
  'Sumo Squat': m(F, ['adductors', 'quads', 'glutes'], ['hamstrings']),
  'Copenhagen Plank': m(B, ['adductors'], ['obliques', 'abs'], 0.1),
  // More hamstrings
  'Lying Leg Curl': m(M, ['hamstrings'], ['calves']),
  'Standing Leg Curl': m(M, ['hamstrings'], ['calves']),
  'Dumbbell Romanian Deadlift': m(F, ['hamstrings', 'glutes'], ['lowerBack', 'forearms']),
  'Single Leg Romanian Deadlift': m(F, ['hamstrings', 'glutes'], ['lowerBack', 'abductors']),
  'Stability Ball Leg Curl': m(B, ['hamstrings'], ['glutes', 'calves'], 0.3),
  // More glutes
  'Barbell Glute Bridge': m(F, ['glutes'], ['hamstrings']),
  'Single Leg Hip Thrust': m(B, ['glutes'], ['hamstrings', 'abductors'], 0.5),
  'Single Leg Glute Bridge': m(B, ['glutes'], ['hamstrings'], 0.35),
  'Smith Machine Hip Thrust': m(M, ['glutes'], ['hamstrings']),
  'Cable Pull Through': m(M, ['glutes', 'hamstrings'], ['lowerBack']),
  'Reverse Hyperextension': m(M, ['glutes', 'hamstrings'], ['lowerBack']),
  'Curtsy Lunge': m(F, ['glutes', 'quads'], ['adductors', 'abductors']),
  'Frog Pumps': m(B, ['glutes'], ['adductors'], 0.3),
  'Donkey Kicks': m(B, ['glutes'], ['hamstrings'], 0.15),
  'Fire Hydrants': m(B, ['abductors', 'glutes'], [], 0.1),
  'Cable Hip Abduction': m(M, ['abductors', 'glutes'], []),
  'Lateral Band Walk': m(B, ['abductors', 'glutes'], [], 0.05),
  'Side Lying Leg Raise': m(B, ['abductors'], ['glutes', 'obliques'], 0.1),
  // More calves
  'Single Leg Calf Raise': m(B, ['calves'], [], 0.9),
  'Bodyweight Calf Raise': m(B, ['calves'], [], 1),
  'Smith Machine Calf Raise': m(M, ['calves'], []),
  'Tibialis Raise': m(B, ['calves'], [], 0.1),
  // More abs
  'Sit-Ups': m(B, ['abs'], ['obliques'], 0.35),
  'Lying Leg Raise': m(B, ['abs'], ['obliques'], 0.3),
  'Hanging Knee Raise': m(B, ['abs'], ['obliques', 'forearms'], 0.25),
  "Captain's Chair Leg Raise": m(B, ['abs'], ['obliques'], 0.3),
  'V-Ups': m(B, ['abs'], ['obliques'], 0.35),
  'Flutter Kicks': m(B, ['abs'], ['quads'], 0.15),
  'Dead Bug': m(B, ['abs'], ['obliques'], 0.1),
  'Hollow Body Hold': m(B, ['abs'], ['obliques'], 0.05),
  'Toe Touches': m(B, ['abs'], [], 0.2),
  'Heel Taps': m(B, ['obliques'], ['abs'], 0.1),
  'Windshield Wipers': m(B, ['obliques', 'abs'], [], 0.3),
  'Plank Shoulder Taps': m(B, ['abs', 'obliques'], ['frontDelts'], 0.1),
  'Bird Dog': m(B, ['lowerBack', 'abs'], ['glutes'], 0.05),
  'Pallof Press': m(M, ['obliques', 'abs'], []),
  'Cable Side Bend': m(M, ['obliques'], []),
  'Landmine Rotation': m(F, ['obliques', 'abs'], ['frontDelts']),
  // More full body
  'Power Clean': m(F, ['traps', 'glutes', 'quads'], ['hamstrings', 'lowerBack', 'forearms']),
  'Hang Clean': m(F, ['traps', 'glutes'], ['quads', 'hamstrings', 'forearms']),
  'Kettlebell Clean and Press': m(F, ['frontDelts', 'glutes'], ['triceps', 'quads', 'abs']),
  'Wall Balls': m(F, ['quads', 'frontDelts'], ['glutes', 'triceps']),
  'Man Makers': m(F, ['chest', 'frontDelts', 'quads'], ['triceps', 'lats', 'abs']),
  'Medicine Ball Slam': m(F, ['lats', 'abs'], ['frontDelts', 'triceps']),
  'Battle Ropes': m(F, ['frontDelts'], ['forearms', 'abs', 'biceps']),
  'Sled Push': m(M, ['quads', 'glutes'], ['calves', 'hamstrings']),
  'Box Jumps': m(B, ['quads', 'glutes'], ['calves', 'hamstrings'], 0.3),
  'Bear Crawl': m(B, ['frontDelts', 'abs'], ['quads', 'triceps'], 0.2),
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

export const GROUP_REGIONS = GROUP_FALLBACK;

/** Muscles the user picked for their custom exercises (kept in sync by the data provider). */
const customMeta = new Map<string, ExerciseMeta>();
export function setCustomMeta(list: { name: string; primary?: Region[]; secondary?: Region[]; equipment?: Equipment }[]) {
  customMeta.clear();
  for (const e of list)
    if (e.primary?.length) customMeta.set(e.name, { equipment: e.equipment ?? 'free', primary: e.primary, secondary: e.secondary ?? [] });
}

/** Muscle + equipment info for any exercise (custom ones use the muscles picked when adding them, else their group). */
export function exerciseMeta(name: string, group: MuscleGroup): ExerciseMeta & { known: boolean } {
  const meta = EXERCISE_META[name] ?? customMeta.get(name);
  if (meta) return { ...meta, known: true };
  return { equipment: 'free', primary: GROUP_FALLBACK[group], secondary: [], known: false };
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = { machine: 'Machine', free: 'Free weights', bodyweight: 'Bodyweight' };
