/**
 * Pure streak math — no I/O, no Supabase. Lives on its own so it can be unit
 * tested and reused. prayerLog.ts feeds it data loaded from the database.
 */

export type DayCounts = Map<string, number>; // "YYYY-MM-DD" -> prayers logged that day
export type Pause = { start: string; end: string | null }; // inclusive date range

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Streak with built-in grace:
 *  - a day counts when >= `minPerDay` prayers were logged (default 4 — one miss forgiven),
 *  - days inside a pause (e.g. Period Pause) are skipped, breaking nothing,
 *  - today is never counted as a break while it's still in progress.
 */
export function streakFromDays(
  byDay: DayCounts,
  pauses: Pause[],
  today: Date,
  minPerDay = 4
): number {
  const paused = (day: string) =>
    pauses.some((z) => day >= z.start && (!z.end || day <= z.end));

  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 400; i++) {
    const day = isoDay(cursor);
    if (paused(day)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if ((byDay.get(day) ?? 0) >= minPerDay) {
      streak++;
    } else if (i === 0) {
      // today not yet complete — don't add, don't break
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
