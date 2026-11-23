import { useEffect } from "react";
import { Redirect, Stack, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useSession } from "@/features/auth/useSession";
import { useAppStore } from "@/lib/store";
import { consumePrayedFromShield, armForToday } from "@/features/blocking/salahFocus";
import { recomputeStreak } from "@/features/prayer/prayerLog";
import {
  configureNotificationHandler,
  registerPrayerCategory,
  schedulePrayerNotifications,
} from "@/features/notifications/prayerNotifications";
import { useNotificationRouting } from "@/features/notifications/useNotificationRouting";
import { theme } from "@/lib/theme";

// Install the foreground-notification handler once, before any component mounts.
configureNotificationHandler();

export default function RootLayout() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const onboarded = useAppStore((s) => s.onboarded);
  const loadOnboarded = useAppStore((s) => s.loadOnboarded);

  // Register the prayer notification category/actions once.
  useEffect(() => {
    registerPrayerCategory().catch(() => {});
  }, []);

  // Route taps on prayer notifications ("I prayed" / "Verify now").
  useNotificationRouting();

  // When signed in: learn onboarding state, credit any shield "I prayed" tap,
  // re-arm today's windows and re-schedule notifications (both drift daily),
  // refresh the streak.
  useEffect(() => {
    if (!session) return;
    loadOnboarded(session.user.id);
    if (consumePrayedFromShield()) recomputeStreak().catch(() => {});
    armForToday().catch(() => {});
    schedulePrayerNotifications().catch(() => {});
  }, [session, loadOnboarded]);

  const booting = loading || (!!session && onboarded === null);
  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const section = segments[0]; // "auth" | "onboarding" | "(tabs)" | undefined
  if (!session && section !== "auth") return <Redirect href="/auth" />;
  if (session && onboarded === false && section !== "onboarding") return <Redirect href="/onboarding" />;
  if (session && onboarded === true && (section === "auth" || section === "onboarding"))
    return <Redirect href="/(tabs)" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="verify" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
