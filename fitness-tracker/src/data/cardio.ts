import type { Template } from '../types';

/** Cardio activities grouped by type. Custom activities default to "Other Cardio". */
export const CARDIO_CATEGORIES: { category: string; activities: string[] }[] = [
  { category: 'Running', activities: ['Outdoor Running', 'Treadmill Running', 'Sprint Intervals', 'Trail Running'] },
  { category: 'Walking', activities: ['Outdoor Walking', 'Treadmill Walking', 'Incline Walking'] },
  { category: 'Cycling', activities: ['Outdoor Cycling', 'Stationary Bike', 'Spin Class'] },
  { category: 'Rowing', activities: ['Rowing Machine', 'Outdoor Rowing'] },
  { category: 'Stair Workouts', activities: ['Stair Climber', 'Stair Running'] },
  { category: 'Elliptical', activities: ['Elliptical Trainer'] },
  { category: 'Swimming', activities: ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly'] },
  { category: 'HIIT', activities: ['HIIT Running', 'HIIT Cycling', 'HIIT Circuit Training'] },
  { category: 'Jump Rope', activities: ['Basic Jump Rope', 'Double Unders'] },
  { category: 'Sports', activities: ['Football', 'Basketball', 'Tennis', 'Badminton', 'Squash', 'Volleyball'] },
  { category: 'Other Cardio', activities: ['Hiking', 'Dancing', 'Aerobics', 'Zumba', 'Martial Arts', 'Boxing', 'Kickboxing'] },
];

export const CARDIO_ACTIVITIES = CARDIO_CATEGORIES.flatMap((c) => c.activities);

const categoryIndex = new Map(CARDIO_CATEGORIES.flatMap((c) => c.activities.map((a) => [a.toLowerCase(), c.category] as const)));

/** Map an activity name to its category ("Other Cardio" if unknown). */
export function cardioCategory(activity: string, custom?: string): string {
  return categoryIndex.get(activity.toLowerCase()) ?? custom ?? 'Other Cardio';
}

/** One-tap starter templates. Users can also save their own sessions as templates. */
export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'tpl-push',
    name: 'Push Day',
    kind: 'strength',
    builtIn: true,
    cardio: [],
    strength: [
      { exercise: 'Barbell Bench Press', muscleGroup: 'CHEST', sets: 4 },
      { exercise: 'Incline Dumbbell Press', muscleGroup: 'CHEST', sets: 3 },
      { exercise: 'Overhead Press', muscleGroup: 'SHOULDERS', sets: 3 },
      { exercise: 'Lateral Raise', muscleGroup: 'SHOULDERS', sets: 3 },
      { exercise: 'Rope Pushdown', muscleGroup: 'TRICEPS', sets: 3 },
      { exercise: 'Overhead Extension', muscleGroup: 'TRICEPS', sets: 3 },
    ],
  },
  {
    id: 'tpl-pull',
    name: 'Pull Day',
    kind: 'strength',
    builtIn: true,
    cardio: [],
    strength: [
      { exercise: 'Deadlift', muscleGroup: 'BACK', sets: 3 },
      { exercise: 'Pull Ups', muscleGroup: 'BACK', sets: 3 },
      { exercise: 'Barbell Row', muscleGroup: 'BACK', sets: 3 },
      { exercise: 'Face Pull', muscleGroup: 'SHOULDERS', sets: 3 },
      { exercise: 'Barbell Curl', muscleGroup: 'BICEPS', sets: 3 },
      { exercise: 'Hammer Curl', muscleGroup: 'BICEPS', sets: 3 },
    ],
  },
  {
    id: 'tpl-legs',
    name: 'Leg Day',
    kind: 'strength',
    builtIn: true,
    cardio: [],
    strength: [
      { exercise: 'Squat', muscleGroup: 'QUADS', sets: 4 },
      { exercise: 'Romanian Deadlift', muscleGroup: 'HAMSTRINGS', sets: 3 },
      { exercise: 'Leg Press', muscleGroup: 'QUADS', sets: 3 },
      { exercise: 'Hamstring Curl', muscleGroup: 'HAMSTRINGS', sets: 3 },
      { exercise: 'Hip Thrust', muscleGroup: 'GLUTES', sets: 3 },
      { exercise: 'Standing Calf Raise', muscleGroup: 'CALVES', sets: 4 },
    ],
  },
  {
    id: 'tpl-upper',
    name: 'Upper Body',
    kind: 'strength',
    builtIn: true,
    cardio: [],
    strength: [
      { exercise: 'Barbell Bench Press', muscleGroup: 'CHEST', sets: 3 },
      { exercise: 'Barbell Row', muscleGroup: 'BACK', sets: 3 },
      { exercise: 'Seated Dumbbell Press', muscleGroup: 'SHOULDERS', sets: 3 },
      { exercise: 'Lat Pulldown', muscleGroup: 'BACK', sets: 3 },
      { exercise: 'Dumbbell Curl', muscleGroup: 'BICEPS', sets: 2 },
      { exercise: 'Tricep Pushdown', muscleGroup: 'TRICEPS', sets: 2 },
    ],
  },
  {
    id: 'tpl-lower',
    name: 'Lower Body',
    kind: 'strength',
    builtIn: true,
    cardio: [],
    strength: [
      { exercise: 'Front Squat', muscleGroup: 'QUADS', sets: 3 },
      { exercise: 'Romanian Deadlift', muscleGroup: 'HAMSTRINGS', sets: 3 },
      { exercise: 'Bulgarian Split Squat', muscleGroup: 'QUADS', sets: 3 },
      { exercise: 'Hamstring Curl', muscleGroup: 'HAMSTRINGS', sets: 3 },
      { exercise: 'Seated Calf Raise', muscleGroup: 'CALVES', sets: 3 },
      { exercise: 'Hanging Leg Raise', muscleGroup: 'ABS', sets: 3 },
    ],
  },
  {
    id: 'tpl-full',
    name: 'Full Body',
    kind: 'strength',
    builtIn: true,
    cardio: [],
    strength: [
      { exercise: 'Squat', muscleGroup: 'QUADS', sets: 3 },
      { exercise: 'Barbell Bench Press', muscleGroup: 'CHEST', sets: 3 },
      { exercise: 'Barbell Row', muscleGroup: 'BACK', sets: 3 },
      { exercise: 'Overhead Press', muscleGroup: 'SHOULDERS', sets: 2 },
      { exercise: 'Kettlebell Swings', muscleGroup: 'FULL BODY', sets: 3 },
      { exercise: 'Plank', muscleGroup: 'ABS', sets: 3 },
    ],
  },
  {
    id: 'tpl-cardio',
    name: 'Cardio Day',
    kind: 'cardio',
    builtIn: true,
    strength: [],
    cardio: [
      { activity: 'Incline Walking', durationMin: 20 },
      { activity: 'Stationary Bike', durationMin: 15 },
    ],
  },
];
