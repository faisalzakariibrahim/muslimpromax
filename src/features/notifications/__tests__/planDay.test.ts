import { planDay, PlannedNote } from "../plan";
import { PrayerName } from "../../../lib/prayerTimes";

const t = (h: number, m = 0) => new Date(2026, 10, 23, h, m); // local time
const times: Record<PrayerName, Date> = {
  fajr: t(5, 30),
  dhuhr: t(11, 45),
  asr: t(14, 15),
  maghrib: t(16, 30),
  isha: t(18, 0),
};
const names = (ns: PlannedNote[]) => ns.map((n) => `${n.name}:${n.kind}`);

describe("planDay", () => {
  it("schedules an adhan alert for every future prayer, no reminders when off", () => {
    const plan = planDay(times, t(0, 0), 0);
    expect(plan).toHaveLength(5);
    expect(plan.every((n) => n.kind === "adhan")).toBe(true);
  });

  it("adds a reminder before each prayer when enabled", () => {
    const plan = planDay(times, t(0, 0), 10);
    expect(plan).toHaveLength(10); // 5 reminders + 5 adhans
    const fajrReminder = plan.find((n) => n.name === "fajr" && n.kind === "reminder")!;
    expect(fajrReminder.at.getTime()).toBe(t(5, 20).getTime()); // 10 min before 5:30
  });

  it("drops prayers already in the past", () => {
    const plan = planDay(times, t(15, 0), 0); // after asr (14:15)
    expect(names(plan)).toEqual(["maghrib:adhan", "isha:adhan"]);
  });

  it("drops a reminder whose lead time has passed but keeps the adhan", () => {
    // now = 11:40, dhuhr 11:45, reminder would be 11:35 (past) -> only adhan kept
    const plan = planDay(times, t(11, 40), 10).filter((n) => n.name === "dhuhr");
    expect(names(plan)).toEqual(["dhuhr:adhan"]);
  });

  it("keeps a reminder that is still in the future", () => {
    const plan = planDay(times, t(11, 30), 10).filter((n) => n.name === "dhuhr");
    expect(names(plan)).toEqual(["dhuhr:reminder", "dhuhr:adhan"]);
  });
});
