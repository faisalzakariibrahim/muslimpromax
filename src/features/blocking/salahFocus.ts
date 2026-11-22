import * as Location from "expo-location";
import ScreenTime, { SelectionSummary } from "../../../modules/screen-time";
import {
  computeSalahWindows,
  PrayerConfig,
  DEFAULT_CONFIG,
} from "../../lib/prayerTimes";

/**
 * Salah Focus orchestrator.
 *
 * Prayer times shift a few minutes every day, but a DeviceActivitySchedule with
 * repeats:true is anchored to fixed hour/minute components. So we RE-ARM daily:
 * call `armForToday()` on launch, on foreground, and from a background refresh
 * task. That keeps the native windows aligned with the real prayer times.
 */

export type FocusMode = "honor" | "proof";

export async function ensureAuthorized(): Promise<boolean> {
  if (!ScreenTime.isSupported()) return false;
  if (ScreenTime.authorizationStatus() === "approved") return true;
  try {
    await ScreenTime.requestAuthorization();
    return ScreenTime.authorizationStatus() === "approved";
  } catch {
    return false;
  }
}

export async function chooseBlockedApps(): Promise<SelectionSummary> {
  return ScreenTime.presentPicker();
}

export function setMode(mode: FocusMode) {
  ScreenTime.setHonorMode(mode === "honor");
}

async function currentCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("location_denied");
  const pos = await Location.getLastKnownPositionAsync();
  const loc = pos ?? (await Location.getCurrentPositionAsync({}));
  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

/** Arm the five prayer windows for today. Returns how many were scheduled. */
export async function armForToday(cfg: PrayerConfig = DEFAULT_CONFIG): Promise<number> {
  if (!(await ensureAuthorized())) return 0;
  const { lat, lng } = await currentCoords();
  const windows = computeSalahWindows(lat, lng, new Date(), cfg);
  return ScreenTime.startSalahFocus(windows);
}

export function disableFocus() {
  ScreenTime.stopSalahFocus();
}

/** Focus Session / Brick Mode: block right now, independent of prayer windows. */
export function blockNow() {
  ScreenTime.shieldNow();
}
export function unblockNow() {
  ScreenTime.clearShield();
}

/**
 * Call on app foreground. If the user tapped "I prayed" on the shield while the
 * app was closed, this returns the prayer timestamp (ms) once so the caller can
 * credit the streak + Noor score. Returns null if nothing is pending.
 */
export function consumePrayedFromShield(): number | null {
  const ts = ScreenTime.consumePrayedPending();
  return ts > 0 ? ts * 1000 : null;
}

export function readShieldCounters() {
  return ScreenTime.readCounters();
}
