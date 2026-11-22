import { supabase } from "../../lib/supabase";
import { postToFeed, myCircles } from "../circle/circle";
import type { PrayerName } from "../../lib/prayerTimes";
import { streakFromDays, type DayCounts, type Pause } from "./streak";

export type PrayerStatus = "on_time" | "late" | "qada" | "missed";
export type VerifyMethod = "honor" | "proof_ai" | "manual";

function localDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Record a prayer. Upserts on (user, name, day) so logging twice is safe. */
export async function logPrayer(opts: {
  name: PrayerName;
  scheduledAt: Date;
  status: PrayerStatus;
  method: VerifyMethod;
  verified: boolean;
  prayedAt?: Date;
}): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;
  const { data, error } = await supabase
    .from("prayers")
    .upsert(
      {
        user_id: uid,
        name: opts.name,
        scheduled_at: opts.scheduledAt.toISOString(),
        prayed_at: (opts.prayedAt ?? new Date()).toISOString(),
        status: opts.status,
        method: opts.method,
        verified: opts.verified,
        local_date: localDate(),
      },
      { onConflict: "user_id,name,local_date" }
    )
    .select("id")
    .single();
  if (error) throw error;

  // Broadcast on-time prayers to every circle (shared accountability).
  if (opts.status === "on_time") {
    const circles = await myCircles().catch(() => []);
    for (const c of circles) {
      await postToFeed(c.id, "prayed_on_time", { prayer: opts.name }).catch(() => {});
    }
  }
  return data.id as string;
}

export async function todaysPrayers() {
  const { data: u } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("prayers")
    .select("*")
    .eq("user_id", u.user!.id)
    .eq("local_date", localDate());
  return data ?? [];
}

/**
 * Streak with built-in grace:
 *  - a day counts if >= 4 of 5 prayers were logged (one miss forgiven),
 *  - days inside an active Period Pause are skipped (neither break nor count).
 */
export async function recomputeStreak(): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;

  const [{ data: prayers }, { data: pauses }] = await Promise.all([
    supabase.from("prayers").select("local_date, status").eq("user_id", uid),
    supabase.from("streak_pauses").select("start_date, end_date").eq("user_id", uid),
  ]);

  const byDay: DayCounts = new Map();
  for (const p of prayers ?? []) {
    if (p.status === "on_time" || p.status === "late") {
      byDay.set(p.local_date, (byDay.get(p.local_date) ?? 0) + 1);
    }
  }
  const pauseRanges: Pause[] = (pauses ?? []).map((z: any) => ({
    start: z.start_date,
    end: z.end_date,
  }));

  const streak = streakFromDays(byDay, pauseRanges, new Date());
  await supabase.from("profiles").update({ current_streak: streak }).eq("id", uid);
  return streak;
}

/** Period Pause — hold the streak, silence reminders, no guilt. */
export async function startPeriodPause() {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("streak_pauses").insert({
    user_id: u.user!.id,
    start_date: localDate(),
    reason: "menses",
  });
  await supabase.from("profiles").update({ period_pause: true }).eq("id", u.user!.id);
}

export async function endPeriodPause() {
  const { data: u } = await supabase.auth.getUser();
  await supabase
    .from("streak_pauses")
    .update({ end_date: localDate() })
    .eq("user_id", u.user!.id)
    .is("end_date", null);
  await supabase.from("profiles").update({ period_pause: false }).eq("id", u.user!.id);
}
