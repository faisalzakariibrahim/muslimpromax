import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  prayerTimesFor,
  DEFAULT_CONFIG,
  PrayerName,
} from "../../lib/prayerTimes";
import { logPrayer, recomputeStreak } from "../prayer/prayerLog";

/**
 * Routes taps on prayer notifications:
 *  - "I prayed" button  → log the prayer silently (no app open)
 *  - "Verify now" / tapping the banner → open the Proof Mode camera
 * Handles both a warm tap (listener) and a cold start (last response).
 */
export function useNotificationRouting() {
  useEffect(() => {
    let mounted = true;
    const handle = (resp: Notifications.NotificationResponse) => {
      const data = resp.notification.request.content.data as { prayer?: PrayerName };
      const action = resp.actionIdentifier;
      if (action === "prayed" && data.prayer) {
        creditPrayer(data.prayer).catch(() => {});
        return;
      }
      // default tap or the "Verify now" action
      setTimeout(() => router.push("/verify"), 300); // let the router mount on cold start
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (mounted && r) handle(r);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
}

async function creditPrayer(name: PrayerName) {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") return;
  const pos =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({}));
  const times = prayerTimesFor(pos.coords.latitude, pos.coords.longitude, new Date(), DEFAULT_CONFIG);
  const onTime = Date.now() - times[name].getTime() < 30 * 60_000;
  await logPrayer({
    name,
    scheduledAt: times[name],
    status: onTime ? "on_time" : "late",
    method: "honor",
    verified: false,
  });
  await recomputeStreak();
}
