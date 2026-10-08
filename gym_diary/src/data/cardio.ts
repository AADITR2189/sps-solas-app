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
