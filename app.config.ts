import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * MuslimProMax — bare/prebuild Expo config.
 *
 * The Screen Time blocking moat requires native iOS app-extension targets
 * (DeviceActivityMonitor + Shield) and the Family Controls entitlement, which
 * ONLY exist in the native project. The `withScreenTime` config plugin injects
 * all of that at prebuild time so `expo prebuild` regenerates it deterministically
 * and we never hand-edit the Xcode project.
 *
 * Family Controls (Distribution) is a restricted entitlement: request it from
 * Apple at https://developer.apple.com/contact/request/family-controls-distribution
 * BEFORE you try to ship. Development works on a real device without approval.
 */
const BUNDLE_ID = "com.flicktek.muslimpromax";
const APP_GROUP = "group.com.flicktek.muslimpromax";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MuslimProMax",
  slug: "muslimpromax",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "muslimpromax",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      NSCameraUsageDescription:
        "MuslimProMax uses the camera only to confirm you prayed when you choose Proof Mode. Images are analyzed and never stored.",
      NSLocationWhenInUseUsageDescription:
        "Your location is used to calculate accurate prayer times and the Qibla direction.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Background location lets prayer times and Salah Focus follow you as you travel.",
      UIBackgroundModes: ["audio", "fetch", "remote-notification"],
    },
    entitlements: {
      "com.apple.developer.family-controls": true,
      "com.apple.security.application-groups": [APP_GROUP],
    },
  },
  android: {
    package: BUNDLE_ID,
    // Android has no Screen Time API equivalent; blocking there uses
    // UsageStatsManager + an AccessibilityService (separate milestone).
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-location",
    "expo-notifications",
    [
      "expo-build-properties",
      { ios: { deploymentTarget: "16.0" } },
    ],
    [
      "./plugins/withScreenTime",
      {
        appGroup: APP_GROUP,
        bundleId: BUNDLE_ID,
        deploymentTarget: "16.0",
      },
    ],
  ],
  extra: {
    appGroup: APP_GROUP,
    // Public, anon Supabase values are safe in the client. The service-role
    // key and ANTHROPIC_API_KEY live ONLY in Supabase Edge Function secrets.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    router: { origin: false },
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
