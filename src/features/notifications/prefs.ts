import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationPrefs = {
  enabled: boolean;
  reminderMinutes: number; // 0 = no pre-prayer reminder
};

const KEY = "mpm.notificationPrefs";
export const DEFAULT_PREFS: NotificationPrefs = { enabled: true, reminderMinutes: 10 };

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setNotificationPrefs(p: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const next = { ...(await getNotificationPrefs()), ...p };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* non-fatal; prefs fall back to defaults */
  }
  return next;
}
