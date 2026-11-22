import { computeNoor } from "../noor";

describe("computeNoor", () => {
  it("rewards a perfect day with a radiant, capped score", () => {
    const n = computeNoor({
      prayersOnTime: 5,
      prayersLate: 0,
      bypasses: 0,
      resists: 6,
      blockedAppMinutes: 0,
      streak: 20,
    });
    expect(n.score).toBeLessThanOrEqual(100);
    expect(n.score).toBeGreaterThanOrEqual(85);
    expect(n.mood).toBe("radiant");
    expect(n.glow).toBeCloseTo(n.score / 100, 5);
  });

  it("dims on a day of no prayers and heavy scrolling", () => {
    const n = computeNoor({
      prayersOnTime: 0,
      prayersLate: 0,
      bypasses: 15,
      resists: 0,
      blockedAppMinutes: 120,
      streak: 0,
    });
    expect(n.score).toBeGreaterThanOrEqual(0);
    expect(n.mood).toBe("dim");
  });

  it("never leaves the 0..100 range even with extreme inputs", () => {
    const huge = computeNoor({
      prayersOnTime: 99,
      prayersLate: 99,
      bypasses: 0,
      resists: 999,
      blockedAppMinutes: 0,
      streak: 999,
    });
    const awful = computeNoor({
      prayersOnTime: 0,
      prayersLate: 0,
      bypasses: 999,
      resists: 0,
      blockedAppMinutes: 9999,
      streak: 0,
    });
    expect(huge.score).toBe(100);
    expect(awful.score).toBe(0);
  });

  it("on-time prayers outweigh late ones", () => {
    const onTime = computeNoor({ prayersOnTime: 3, prayersLate: 0, bypasses: 0, resists: 0, blockedAppMinutes: 0, streak: 0 });
    const late = computeNoor({ prayersOnTime: 0, prayersLate: 3, bypasses: 0, resists: 0, blockedAppMinutes: 0, streak: 0 });
    expect(onTime.score).toBeGreaterThan(late.score);
  });

  it("moves through every mood band as the day improves", () => {
    const dim = computeNoor({ prayersOnTime: 0, prayersLate: 0, bypasses: 8, resists: 0, blockedAppMinutes: 40, streak: 0 });
    const flick = computeNoor({ prayersOnTime: 0, prayersLate: 0, bypasses: 0, resists: 0, blockedAppMinutes: 0, streak: 0 });
    const warm = computeNoor({ prayersOnTime: 2, prayersLate: 0, bypasses: 0, resists: 0, blockedAppMinutes: 0, streak: 0 });
    expect(dim.mood).toBe("dim");
    expect(flick.mood).toBe("flickering");
    expect(warm.mood).toBe("warm");
  });
});
