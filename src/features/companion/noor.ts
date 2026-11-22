/**
 * Noor — the companion lantern.
 *
 * Our answer to Prayer Pause's "Sabr the camel", deliberately distinct: a lantern
 * whose light grows with on-time prayer and consistency, and dims with bypasses
 * and time lost in blocked apps. The Noor Score is a single 0..100 daily number.
 *
 * Pure, testable logic — no UI, no I/O. The screen renders the lantern from
 * `glow` and `mood`.
 */

export type NoorInputs = {
  prayersOnTime: number; // 0..5 today
  prayersLate: number; // 0..5 today
  bypasses: number; // shield "stay blocked"/dodge taps today
  resists: number; // shield "I prayed" / resisted-scroll today
  blockedAppMinutes: number; // minutes spent in blocked apps today
  streak: number; // current day streak
};

export type NoorState = {
  score: number; // 0..100
  glow: number; // 0..1 for the lantern brightness
  mood: "radiant" | "warm" | "flickering" | "dim";
  message: string;
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function computeNoor(i: NoorInputs): NoorState {
  // Base 50. Prayers are the dominant signal; distractions pull down.
  let score = 50;
  score += i.prayersOnTime * 8; // up to +40
  score += i.prayersLate * 3; // partial credit
  score += Math.min(i.resists, 10) * 1.5;
  score += Math.min(i.streak, 30) * 0.5; // consistency bonus, capped
  score -= Math.min(i.bypasses, 15) * 2;
  score -= Math.min(i.blockedAppMinutes, 120) * 0.25;

  score = clamp(Math.round(score));
  const glow = clamp(score, 0, 100) / 100;

  let mood: NoorState["mood"];
  let message: string;
  if (score >= 85) {
    mood = "radiant";
    message = "Noor is radiant. Your light is shining, mashaAllah.";
  } else if (score >= 65) {
    mood = "warm";
    message = "Noor glows warmly. Keep tending the light.";
  } else if (score >= 40) {
    mood = "flickering";
    message = "Noor is flickering. One prayer on time will steady it.";
  } else {
    mood = "dim";
    message = "Noor has dimmed. Come back — the next prayer is a fresh start.";
  }

  return { score, glow, mood, message };
}
