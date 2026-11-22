import { streakFromDays, DayCounts, Pause } from "../streak";

const days = (from: string, n: number, perDay: number): DayCounts => {
  const m: DayCounts = new Map();
  const c = new Date(from);
  for (let i = 0; i < n; i++) {
    m.set(c.toISOString().slice(0, 10), perDay);
    c.setDate(c.getDate() - 1);
  }
  return m;
};
const today = new Date("2026-11-22T12:00:00Z");

describe("streakFromDays", () => {
  it("counts a run of complete days", () => {
    expect(streakFromDays(days("2026-11-22", 10, 5), [], today)).toBe(10);
  });

  it("forgives one missed prayer per day (4 of 5 still counts)", () => {
    expect(streakFromDays(days("2026-11-22", 5, 4), [], today)).toBe(5);
  });

  it("breaks when a past day falls below the grace threshold", () => {
    const m: DayCounts = new Map([
      ["2026-11-22", 5],
      ["2026-11-21", 3], // below 4 -> breaks here
      ["2026-11-20", 5],
    ]);
    expect(streakFromDays(m, [], today)).toBe(1);
  });

  it("does not break on an incomplete today", () => {
    const m: DayCounts = new Map([
      ["2026-11-22", 1], // today, still in progress
      ["2026-11-21", 5],
      ["2026-11-20", 5],
    ]);
    expect(streakFromDays(m, [], today)).toBe(2);
  });

  it("skips Period-Pause days without breaking the streak", () => {
    const m: DayCounts = new Map([
      ["2026-11-22", 5],
      // 19-21 paused, no prayers logged
      ["2026-11-18", 5],
      ["2026-11-17", 5],
    ]);
    const pauses: Pause[] = [{ start: "2026-11-19", end: "2026-11-21" }];
    expect(streakFromDays(m, pauses, today)).toBe(3);
  });

  it("treats an open-ended pause (end=null) as ongoing", () => {
    const m: DayCounts = new Map([["2026-11-18", 5]]);
    const pauses: Pause[] = [{ start: "2026-11-19", end: null }];
    // 19-22 all paused and skipped, then 18 counts
    expect(streakFromDays(m, pauses, today)).toBe(1);
  });

  it("returns 0 when today is incomplete and yesterday was missed", () => {
    const m: DayCounts = new Map([["2026-11-22", 0], ["2026-11-21", 2]]);
    expect(streakFromDays(m, [], today)).toBe(0);
  });
});
