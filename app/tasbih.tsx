import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { ContentHeader } from "@/features/content/ContentHeader";
import { DHIKR, Dhikr, addToTotal, loadTotals } from "@/features/content/tasbih";
import { theme } from "@/lib/theme";

export default function Tasbih() {
  const [active, setActive] = useState<Dhikr>(DHIKR[0]);
  const [count, setCount] = useState(0);
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTotals().then(setTotals);
  }, []);

  const tap = async () => {
    const next = count + 1;
    setCount(next);
    Haptics.impactAsync(
      next % active.target === 0
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
    const total = await addToTotal(active.id, 1);
    setTotals((t) => ({ ...t, [active.id]: total }));
  };

  const pick = (d: Dhikr) => {
    setActive(d);
    setCount(0);
  };

  const round = Math.floor(count / active.target);
  const inRound = count % active.target;

  return (
    <View style={s.wrap}>
      <ContentHeader title="Tasbih" subtitle="Digital dhikr counter" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsWrap} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {DHIKR.map((d) => (
          <Pressable key={d.id} style={[s.chip, active.id === d.id && s.chipOn]} onPress={() => pick(d)}>
            <Text style={[s.chipText, active.id === d.id && { color: theme.colors.primaryDark }]}>{d.translit}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={s.counter} onPress={tap}>
        <Text style={s.ar}>{active.ar}</Text>
        <Text style={s.meaning}>{active.meaning}</Text>
        <Text style={s.count}>{inRound}<Text style={s.target}> / {active.target}</Text></Text>
        <Text style={s.round}>round {round + 1}</Text>
        <Text style={s.hint}>tap anywhere to count</Text>
      </Pressable>

      <View style={s.footer}>
        <Pressable style={s.reset} onPress={() => setCount(0)}><Text style={s.resetText}>Reset round</Text></Pressable>
        <Text style={s.lifetime}>Lifetime: {(totals[active.id] ?? 0).toLocaleString()}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  chipsWrap: { flexGrow: 0, paddingVertical: 14 },
  chip: { backgroundColor: theme.colors.surface2, borderRadius: theme.radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: theme.colors.primary },
  chipText: { color: theme.colors.text, fontWeight: "600", fontSize: 13 },
  counter: { flex: 1, margin: 16, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center", padding: 24 },
  ar: { color: theme.colors.gold, fontSize: 34, writingDirection: "rtl", textAlign: "center" },
  meaning: { color: theme.colors.textDim, fontSize: 14, marginTop: 8, textAlign: "center" },
  count: { color: theme.colors.text, fontSize: 72, fontWeight: "800", marginTop: 20, fontVariant: ["tabular-nums"] },
  target: { color: theme.colors.textFaint, fontSize: 28, fontWeight: "600" },
  round: { color: theme.colors.primary, fontSize: 14, marginTop: 4 },
  hint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 18 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingBottom: 28 },
  reset: { backgroundColor: theme.colors.surface2, borderRadius: theme.radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  resetText: { color: theme.colors.textDim, fontWeight: "600" },
  lifetime: { color: theme.colors.textDim, fontSize: 13 },
});
