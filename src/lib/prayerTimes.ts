import {
  CalculationMethod,
  Coordinates,
  PrayerTimes,
  Qibla,
  Madhab,
  CalculationParameters,
} from "adhan";
import type { SalahWindow } from "../../modules/screen-time";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export const PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export type MethodKey =
  | "MuslimWorldLeague"
  | "NorthAmerica"
  | "Egyptian"
  | "UmmAlQura"
  | "Dubai"
  | "Qatar"
  | "Kuwait"
  | "MoonsightingCommittee"
  | "Singapore"
  | "Turkey"
  | "Tehran"
  | "Karachi";

export type PrayerConfig = {
  method: MethodKey;
  madhab: "shafi" | "hanafi";
  /** Minutes of blocking after each prayer time. Ignored if untilNextPrayer. */
  focusMinutes: number;
  /** Block until the next prayer begins instead of a fixed window. */
  untilNextPrayer: boolean;
};

export const DEFAULT_CONFIG: PrayerConfig = {
  method: "NorthAmerica",
  madhab: "shafi",
  focusMinutes: 25,
  untilNextPrayer: false,
};

function params(cfg: PrayerConfig): CalculationParameters {
  const p = (CalculationMethod[cfg.method] ?? CalculationMethod.NorthAmerica)();
  p.madhab = cfg.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return p;
}

export function prayerTimesFor(
  lat: number,
  lng: number,
  date: Date,
  cfg: PrayerConfig
): Record<PrayerName, Date> {
  const pt = new PrayerTimes(new Coordinates(lat, lng), date, params(cfg));
  return { fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

export function qiblaDirection(lat: number, lng: number): number {
  return Qibla(new Coordinates(lat, lng));
}

/** Compute today's blocking windows as local hour/minute pairs for the native scheduler. */
export function computeSalahWindows(
  lat: number,
  lng: number,
  date: Date,
  cfg: PrayerConfig
): SalahWindow[] {
  const today = prayerTimesFor(lat, lng, date, cfg);
  // Tomorrow's fajr bounds the isha window when "until next prayer" is on.
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextFajr = prayerTimesFor(lat, lng, tomorrow, cfg).fajr;

  const order: { name: PrayerName; start: Date; next: Date }[] = [
    { name: "fajr", start: today.fajr, next: today.dhuhr },
    { name: "dhuhr", start: today.dhuhr, next: today.asr },
    { name: "asr", start: today.asr, next: today.maghrib },
    { name: "maghrib", start: today.maghrib, next: today.isha },
    { name: "isha", start: today.isha, next: nextFajr },
  ];

  return order.map(({ name, start, next }) => {
    const end = cfg.untilNextPrayer
      ? next
      : new Date(start.getTime() + cfg.focusMinutes * 60_000);
    return {
      name,
      startHour: start.getHours(),
      startMinute: start.getMinutes(),
      endHour: end.getHours(),
      endMinute: end.getMinutes(),
    };
  });
}

export function nextPrayer(
  times: Record<PrayerName, Date>,
  now = new Date()
): { name: PrayerName; at: Date } {
  for (const name of PRAYERS) {
    if (times[name] > now) return { name, at: times[name] };
  }
  return { name: "fajr", at: times.fajr }; // tomorrow
}

/** The most recent prayer whose time has already passed today (the active window). */
export function currentPrayer(
  times: Record<PrayerName, Date>,
  now = new Date()
): { name: PrayerName; at: Date } {
  let current: { name: PrayerName; at: Date } = { name: "isha", at: times.isha };
  for (const name of PRAYERS) {
    if (times[name] <= now) current = { name, at: times[name] };
  }
  // Before Fajr: the still-active window is last night's Isha.
  if (now < times.fajr) return { name: "isha", at: times.isha };
  return current;
}
