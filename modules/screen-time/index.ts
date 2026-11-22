import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type SelectionSummary = {
  applications: number;
  categories: number;
  webDomains: number;
};

export type SalahWindow = {
  name: string; // "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

type ScreenTimeNative = {
  isSupported(): boolean;
  authorizationStatus(): "approved" | "denied" | "notDetermined";
  requestAuthorization(): Promise<"approved">;
  presentPicker(): Promise<SelectionSummary>;
  getSelectionSummary(): SelectionSummary;
  setHonorMode(honor: boolean): void;
  startSalahFocus(windows: SalahWindow[]): number;
  stopSalahFocus(): void;
  shieldNow(): void;
  clearShield(): void;
  readCounters(): { bypass: number; resist: number; blockedSeconds: number };
  consumePrayedPending(): number; // unix seconds, 0 if none
};

// On Android (and Simulator) the native module still loads but reports
// isSupported() === false so the UI can degrade gracefully.
const noop: ScreenTimeNative = {
  isSupported: () => false,
  authorizationStatus: () => "notDetermined",
  requestAuthorization: async () => "approved",
  presentPicker: async () => ({ applications: 0, categories: 0, webDomains: 0 }),
  getSelectionSummary: () => ({ applications: 0, categories: 0, webDomains: 0 }),
  setHonorMode: () => {},
  startSalahFocus: () => 0,
  stopSalahFocus: () => {},
  shieldNow: () => {},
  clearShield: () => {},
  readCounters: () => ({ bypass: 0, resist: 0, blockedSeconds: 0 }),
  consumePrayedPending: () => 0,
};

let native: ScreenTimeNative;
try {
  native = requireNativeModule<ScreenTimeNative>("ScreenTime");
} catch {
  native = noop;
}

export const ScreenTime = Platform.OS === "ios" ? native : noop;
export default ScreenTime;
