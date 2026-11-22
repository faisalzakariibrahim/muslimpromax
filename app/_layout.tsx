import { useEffect } from "react";
import { Redirect, Stack, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useSession } from "@/features/auth/useSession";
import { consumePrayedFromShield, armForToday } from "@/features/blocking/salahFocus";
import { recomputeStreak } from "@/features/prayer/prayerLog";
import { theme } from "@/lib/theme";

export default function RootLayout() {
  const { session, loading } = useSession();
  const segments = useSegments();

  // On foreground: credit any "I prayed" tap from the shield, re-arm today's
  // windows (prayer times drift daily), and refresh the streak.
  useEffect(() => {
    if (!session) return;
    const pending = consumePrayedFromShield();
    if (pending) recomputeStreak().catch(() => {});
    armForToday().catch(() => {});
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const inAuth = segments[0] === "auth";
  if (!session && !inAuth) return <Redirect href="/auth" />;
  if (session && inAuth) return <Redirect href="/(tabs)" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="verify" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
