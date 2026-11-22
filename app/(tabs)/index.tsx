import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import * as Location from "expo-location";
import { theme } from "@/lib/theme";
import {
  prayerTimesFor,
  nextPrayer,
  DEFAULT_CONFIG,
  PRAYERS,
  PrayerName,
} from "@/lib/prayerTimes";
import { computeNoor } from "@/features/companion/noor";
import { NoorLantern } from "@/features/companion/NoorLantern";
import { readShieldCounters } from "@/features/blocking/salahFocus";
import { logPrayer, todaysPrayers, recomputeStreak } from "@/features/prayer/prayerLog";

const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function Today() {
  const [times, setTimes] = useState<Record<PrayerName, Date> | null>(null);
  const [logged, setLogged] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);

  const load = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const pos =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({}));
      setTimes(prayerTimesFor(pos.coords.latitude, pos.coords.longitude, new Date(), DEFAULT_CONFIG));
    }
    const today = await todaysPrayers().catch(() => []);
    const map: Record<string, string> = {};
    today.forEach((p: any) => (map[p.name] = p.status));
    setLogged(map);
    setStreak(await recomputeStreak().catch(() => 0));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counters = readShieldCounters();
  const noor = computeNoor({
    prayersOnTime: Object.values(logged).filter((s) => s === "on_time").length,
    prayersLate: Object.values(logged).filter((s) => s === "late").length,
    bypasses: counters.bypass,
    resists: counters.resist,
    blockedAppMinutes: Math.round(counters.blockedSeconds / 60),
    streak,
  });

  const mark = async (name: PrayerName) => {
    if (!times) return;
    const now = new Date();
    const onTime = now.getTime() - times[name].getTime() < 30 * 60_000;
    try {
      await logPrayer({
        name,
        scheduledAt: times[name],
        status: onTime ? "on_time" : "late",
        method: "honor",
        verified: false,
      });
      setLogged((m) => ({ ...m, [name]: onTime ? "on_time" : "late" }));
      setStreak(await recomputeStreak());
    } catch (e: any) {
      Alert.alert("Could not log prayer", e.message);
    }
  };

  const up = times ? nextPrayer(times) : null;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <View style={s.hero}>
        <NoorLantern state={noor} />
        <Text style={s.score}>{noor.score}</Text>
        <Text style={s.scoreLabel}>Noor Score</Text>
        <Text style={s.mood}>{noor.message}</Text>
        <View style={s.streakPill}>
          <Text style={s.streakText}>🔥 {streak}-day streak</Text>
        </View>
      </View>

      {up && (
        <View style={s.nextCard}>
          <Text style={s.nextLabel}>Next prayer</Text>
          <Text style={s.nextName}>
            {up.name[0].toUpperCase() + up.name.slice(1)} · {fmt(up.at)}
          </Text>
        </View>
      )}

      <Text style={s.section}>Today's prayers</Text>
      {times &&
        PRAYERS.map((name) => {
          const st = logged[name];
          return (
            <Pressable key={name} style={s.row} onPress={() => !st && mark(name)}>
              <Text style={s.rowName}>{name[0].toUpperCase() + name.slice(1)}</Text>
              <Text style={s.rowTime}>{fmt(times[name])}</Text>
              <Text style={[s.rowState, st === "on_time" && { color: theme.colors.primary }]}>
                {st === "on_time" ? "✓ on time" : st === "late" ? "✓ late" : "tap to log"}
              </Text>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  hero: { alignItems: "center", marginBottom: 20 },
  score: { color: theme.colors.text, fontSize: 44, fontWeight: "800", marginTop: 4 },
  scoreLabel: { color: theme.colors.textFaint, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  mood: { color: theme.colors.textDim, textAlign: "center", marginTop: 10, fontSize: 14 },
  streakPill: { marginTop: 14, backgroundColor: theme.colors.surface2, paddingHorizontal: 14, paddingVertical: 6, borderRadius: theme.radius.pill },
  streakText: { color: theme.colors.gold, fontWeight: "700" },
  nextCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 18, marginBottom: 24 },
  nextLabel: { color: theme.colors.textFaint, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  nextName: { color: theme.colors.text, fontSize: 22, fontWeight: "700", marginTop: 4 },
  section: { color: theme.colors.textDim, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 8 },
  rowName: { color: theme.colors.text, fontSize: 16, fontWeight: "600", flex: 1 },
  rowTime: { color: theme.colors.textDim, fontSize: 15, marginRight: 14 },
  rowState: { color: theme.colors.textFaint, fontSize: 13, width: 86, textAlign: "right" },
});
