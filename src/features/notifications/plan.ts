import { PRAYERS, PrayerName } from "../../lib/prayerTimes";

/**
 * Pure notification scheduling plan — no React Native / Expo imports, so it can
 * be unit tested. `prayerNotifications.ts` consumes this and does the I/O.
 */
export type PlannedNote = { name: PrayerName; kind: "reminder" | "adhan"; at: Date };

/**
 * Given a day's prayer times, return the notifications to schedule: an optional
 * "coming up" reminder `reminderMinutes` before each prayer, and the prayer-time
 * alert itself. Anything already in the past (relative to `now`) is dropped.
 */
export function planDay(
  times: Record<PrayerName, Date>,
  now: Date,
  reminderMinutes: number
): PlannedNote[] {
  const out: PlannedNote[] = [];
  for (const name of PRAYERS) {
    const at = times[name];
    if (reminderMinutes > 0) {
      const r = new Date(at.getTime() - reminderMinutes * 60_000);
      if (r.getTime() > now.getTime()) out.push({ name, kind: "reminder", at: r });
    }
    if (at.getTime() > now.getTime()) out.push({ name, kind: "adhan", at });
  }
  return out;
}
