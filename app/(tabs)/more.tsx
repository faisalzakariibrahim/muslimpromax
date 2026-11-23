import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { theme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/features/auth/useSession";
import { startPeriodPause, endPeriodPause } from "@/features/prayer/prayerLog";
import { getNotificationPrefs, setNotificationPrefs } from "@/features/notifications/prefs";
import { schedulePrayerNotifications } from "@/features/notifications/prayerNotifications";

const LIBRARY = [
  { icon: "📖", label: "Qur'an", sub: "114 surahs · offline", href: "/quran", ready: true },
  { icon: "🤲", label: "Dua & Adhkar", sub: "Hisnul Muslim", href: "/dua", ready: true },
  { icon: "📿", label: "Tasbih", sub: "Dhikr counter", href: "/tasbih", ready: true },
  { icon: "📜", label: "Hadith", sub: "Coming soon", href: "/hadith", ready: false },
];
const COMING = ["Qibla Compass", "Islamic Presets (Jummah · Tahajjud · Taraweeh · Last 10)", "Widgets & Live Activities"];

const REMINDER_OPTIONS = [0, 5, 10, 15];

export default function More() {
  const [paused, setPaused] = useState(false);
  const [notify, setNotify] = useState(true);
  const [reminder, setReminder] = useState(10);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("period_pause").eq("id", data.user.id).single();
      setPaused(!!p?.period_pause);
    });
    getNotificationPrefs().then((p) => {
      setNotify(p.enabled);
      setReminder(p.reminderMinutes);
    });
  }, []);

  const toggleNotify = async () => {
    const next = !notify;
    setNotify(next);
    await setNotificationPrefs({ enabled: next });
    schedulePrayerNotifications().catch(() => {});
  };
  const cycleReminder = async () => {
    const i = (REMINDER_OPTIONS.indexOf(reminder) + 1) % REMINDER_OPTIONS.length;
    const next = REMINDER_OPTIONS[i];
    setReminder(next);
    await setNotificationPrefs({ reminderMinutes: next });
    schedulePrayerNotifications().catch(() => {});
  };

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

      <Text style={s.section}>Library</Text>
      <View style={s.grid}>
        {LIBRARY.map((it) => (
          <Pressable key={it.label} style={s.tile} onPress={() => router.push(it.href as any)}>
            <Text style={s.tileIcon}>{it.icon}</Text>
            <Text style={s.tileLabel}>{it.label}</Text>
            <Text style={s.tileSub}>{it.sub}</Text>
            {!it.ready && <View style={s.soonDot} />}
          </Pressable>
        ))}
      </View>

      <Text style={s.section}>Settings</Text>
      <View style={s.card}>
        <View style={s.rowBetween}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={s.cardTitle}>🔔 Prayer reminders</Text>
            <Text style={s.cardSub}>Time-sensitive alerts at each salah, with “I prayed” and “Verify now”.</Text>
          </View>
          <Switch value={notify} onValueChange={toggleNotify} trackColor={{ true: theme.colors.primary }} />
        </View>
        {notify && (
          <Pressable style={s.reminderRow} onPress={cycleReminder}>
            <Text style={s.reminderLabel}>Heads-up before prayer</Text>
            <Text style={s.reminderValue}>{reminder === 0 ? "Off" : `${reminder} min`}</Text>
          </Pressable>
        )}
      </View>

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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  tile: { width: "47.5%", backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, minHeight: 104 },
  tileIcon: { fontSize: 26 },
  tileLabel: { color: theme.colors.text, fontSize: 15, fontWeight: "700", marginTop: 10 },
  tileSub: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  soonDot: { position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.gold },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "transparent" },
  rowBetween: { flexDirection: "row", alignItems: "center" },
  reminderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.surface2 },
  reminderLabel: { color: theme.colors.textDim, fontSize: 14 },
  reminderValue: { color: theme.colors.primary, fontWeight: "700", fontSize: 14 },
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
