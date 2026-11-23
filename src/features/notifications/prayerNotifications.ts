import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import {
  prayerTimesFor,
  PrayerConfig,
  DEFAULT_CONFIG,
} from "../../lib/prayerTimes";
import { planDay, PlannedNote } from "./plan";
import { getNotificationPrefs } from "./prefs";

export const PRAYER_CATEGORY = "prayer";
export { planDay } from "./plan";
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function content(n: PlannedNote, reminderMinutes: number): Notifications.NotificationContentInput {
  const name = cap(n.name);
  if (n.kind === "reminder") {
    return {
      title: `${name} soon`,
      body: `${name} is in ${reminderMinutes} minutes. Wrap up and get ready.`,
      categoryIdentifier: PRAYER_CATEGORY,
      data: { prayer: n.name, kind: n.kind },
      interruptionLevel: "active",
      sound: "default",
    };
  }
  return {
    title: `${name} · time to pray`,
    body: "Pause and pray. Tap to verify when you're done.",
    categoryIdentifier: PRAYER_CATEGORY,
    data: { prayer: n.name, kind: n.kind },
    interruptionLevel: "timeSensitive", // breaks through Focus / silent
    sound: "default",
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerPrayerCategory() {
  await Notifications.setNotificationCategoryAsync(PRAYER_CATEGORY, [
    { identifier: "verify", buttonTitle: "Verify now", options: { opensAppToForeground: true } },
    { identifier: "prayed", buttonTitle: "I prayed", options: { opensAppToForeground: false } },
  ]);
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("prayer", {
      name: "Prayer times",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return req.granted;
}

// ---------------------------------------------------------------------------
// Scheduling — re-run daily (prayer times drift) on launch/foreground
// ---------------------------------------------------------------------------
export async function schedulePrayerNotifications(
  cfg: PrayerConfig = DEFAULT_CONFIG,
  horizonDays = 2
): Promise<number> {
  const prefs = await getNotificationPrefs();
  if (!prefs.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return 0;
  }
  if (!(await ensurePermission())) return 0;

  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") return 0;
  const pos =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({}));
  const { latitude: lat, longitude: lng } = pos.coords;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  let scheduled = 0;
  for (let d = 0; d < horizonDays; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const times = prayerTimesFor(lat, lng, day, cfg);
    // For future days nothing is in the past, so use epoch 0 as the floor.
    const plan = planDay(times, d === 0 ? now : new Date(0), prefs.reminderMinutes);
    for (const note of plan) {
      await Notifications.scheduleNotificationAsync({
        content: content(note, prefs.reminderMinutes),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: note.at },
      });
      scheduled++;
    }
  }
  return scheduled;
}

export async function cancelPrayerNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
