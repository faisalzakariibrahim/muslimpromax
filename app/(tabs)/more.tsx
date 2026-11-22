import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { theme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/features/auth/useSession";
import { startPeriodPause, endPeriodPause } from "@/features/prayer/prayerLog";

const COMING = ["Qur'an Reader", "Hadith (Nawawi 40 · Bukhari)", "Dua — Hisnul Muslim", "Tasbih Counter", "Qibla Compass", "Islamic Presets (Jummah · Tahajjud · Taraweeh · Last 10)", "Widgets & Live Activities"];

export default function More() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("period_pause").eq("id", data.user.id).single();
      setPaused(!!p?.period_pause);
    });
  }, []);

  const togglePause = async () => {
    try {
      paused ? await endPeriodPause() : await startPeriodPause();
      setPaused(!paused);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <Text style={s.h1}>More</Text>

      <Pressable style={[s.card, paused && s.cardActive]} onPress={togglePause}>
        <Text style={s.cardTitle}>🌙 Period Pause</Text>
        <Text style={s.cardSub}>
          {paused
            ? "Active — streak held, reminders silenced. Tap to end."
            : "Hold your streak and silence reminders during menses. No broken streaks, no guilt."}
        </Text>
      </Pressable>

      <Text style={s.section}>On the roadmap</Text>
      {COMING.map((t) => (
        <View key={t} style={s.row}>
          <Text style={s.rowText}>{t}</Text>
          <Text style={s.soon}>soon</Text>
        </View>
      ))}

      <Pressable style={s.signout} onPress={signOut}>
        <Text style={s.signoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  h1: { color: theme.colors.text, fontSize: 28, fontWeight: "800", marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: "transparent" },
  cardActive: { borderColor: theme.colors.primary },
  cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "700" },
  cardSub: { color: theme.colors.textDim, fontSize: 14, marginTop: 6, lineHeight: 20 },
  section: { color: theme.colors.textDim, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 8 },
  rowText: { color: theme.colors.text, flex: 1, fontSize: 15 },
  soon: { color: theme.colors.textFaint, fontSize: 12 },
  signout: { marginTop: 24, alignItems: "center", padding: 14 },
  signoutText: { color: theme.colors.danger, fontWeight: "600" },
});
