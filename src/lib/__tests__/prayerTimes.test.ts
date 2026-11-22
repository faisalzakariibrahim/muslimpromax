import {
  prayerTimesFor,
  computeSalahWindows,
  currentPrayer,
  nextPrayer,
  qiblaDirection,
  PRAYERS,
  DEFAULT_CONFIG,
  PrayerConfig,
} from "../prayerTimes";

// New York City, a fixed date, ISNA/North America method.
const NYC = { lat: 40.7128, lng: -74.006 };
const date = new Date("2026-11-22T17:00:00Z"); // midday in NYC
const cfg: PrayerConfig = DEFAULT_CONFIG;

describe("prayerTimesFor", () => {
  const t = prayerTimesFor(NYC.lat, NYC.lng, date, cfg);

  it("returns all five prayers", () => {
    expect(Object.keys(t).sort()).toEqual([...PRAYERS].sort());
  });

  it("orders them chronologically through the day", () => {
    expect(t.fajr.getTime()).toBeLessThan(t.dhuhr.getTime());
    expect(t.dhuhr.getTime()).toBeLessThan(t.asr.getTime());
    expect(t.asr.getTime()).toBeLessThan(t.maghrib.getTime());
    expect(t.maghrib.getTime()).toBeLessThan(t.isha.getTime());
  });

  it("respects the Hanafi madhab giving a later Asr than Shafi", () => {
    const shafi = prayerTimesFor(NYC.lat, NYC.lng, date, { ...cfg, madhab: "shafi" });
    const hanafi = prayerTimesFor(NYC.lat, NYC.lng, date, { ...cfg, madhab: "hanafi" });
    expect(hanafi.asr.getTime()).toBeGreaterThan(shafi.asr.getTime());
  });
});

describe("computeSalahWindows", () => {
  it("produces five windows", () => {
    expect(computeSalahWindows(NYC.lat, NYC.lng, date, cfg)).toHaveLength(5);
  });

  it("uses a fixed focus length in fixed mode", () => {
    const w = computeSalahWindows(NYC.lat, NYC.lng, date, { ...cfg, focusMinutes: 25, untilNextPrayer: false });
    for (const win of w) {
      let dur = win.endHour * 60 + win.endMinute - (win.startHour * 60 + win.startMinute);
      if (dur < 0) dur += 1440; // midnight wrap
      expect(dur).toBe(25);
    }
  });

  it("every window has valid clock components", () => {
    const w = computeSalahWindows(NYC.lat, NYC.lng, date, cfg);
    for (const win of w) {
      expect(win.startHour).toBeGreaterThanOrEqual(0);
      expect(win.startHour).toBeLessThan(24);
      expect(win.startMinute).toBeGreaterThanOrEqual(0);
      expect(win.startMinute).toBeLessThan(60);
    }
  });
});

describe("currentPrayer / nextPrayer", () => {
  const t = prayerTimesFor(NYC.lat, NYC.lng, date, cfg);

  it("falls back to Isha before Fajr", () => {
    expect(currentPrayer(t, new Date(t.fajr.getTime() - 60_000)).name).toBe("isha");
  });

  it("reports the window you are in", () => {
    expect(currentPrayer(t, new Date(t.dhuhr.getTime() + 60_000)).name).toBe("dhuhr");
  });

  it("reports the upcoming prayer", () => {
    expect(nextPrayer(t, new Date(t.maghrib.getTime() - 60_000)).name).toBe("maghrib");
  });
});

describe("qiblaDirection", () => {
  it("points east-northeast from New York toward Makkah (~58°)", () => {
    const q = qiblaDirection(NYC.lat, NYC.lng);
    expect(q).toBeGreaterThan(45);
    expect(q).toBeLessThan(70);
  });
});
