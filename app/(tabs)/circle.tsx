import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { theme } from "@/lib/theme";
import {
  Circle,
  LeaderRow,
  FeedItem,
  myCircles,
  createCircle,
  joinByCode,
  leaderboard,
  getFeed,
  subscribeFeed,
} from "@/features/circle/circle";

const kindText: Record<string, (p: any) => string> = {
  prayed_on_time: (p) => `prayed ${p.prayer} on time 🟢`,
  streak_milestone: (p) => `hit a ${p.days}-day streak 🔥`,
  join: () => `joined the circle 🤲`,
  nudge: (p) => `nudged ${p.to} 👋`,
};

export default function CircleTab() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [active, setActive] = useState<Circle | null>(null);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const refresh = useCallback(async () => {
    const cs = await myCircles().catch(() => []);
    setCircles(cs);
    if (cs.length && !active) setActive(cs[0]);
  }, [active]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!active) return;
    leaderboard(active.id).then(setBoard).catch(() => {});
    getFeed(active.id).then(setFeed).catch(() => {});
    const sub = subscribeFeed(active.id, (item) => setFeed((f) => [item, ...f]));
    return () => {
      sub.unsubscribe();
    };
  }, [active]);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const c = await createCircle(name.trim());
      setName("");
      setActive(c);
      refresh();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };
  const join = async () => {
    try {
      const c = await joinByCode(code.trim());
      setCode("");
      setActive(c);
      refresh();
    } catch (e: any) {
      Alert.alert("Couldn't join", e.message);
    }
  };

  if (!circles.length) {
    return (
      <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
        <Text style={s.h1}>Prayer Circle</Text>
        <Text style={s.p}>Pray together, stay accountable. Start a circle with family or friends, or join one with a code.</Text>
        <TextInput style={s.input} placeholder="Circle name" placeholderTextColor={theme.colors.textFaint} value={name} onChangeText={setName} />
        <Pressable style={s.btn} onPress={create}><Text style={s.btnText}>Create circle</Text></Pressable>
        <Text style={s.or}>or</Text>
        <TextInput style={s.input} placeholder="6-letter invite code" autoCapitalize="characters" placeholderTextColor={theme.colors.textFaint} value={code} onChangeText={setCode} />
        <Pressable style={[s.btn, s.btnGhost]} onPress={join}><Text style={[s.btnText, s.btnTextGhost]}>Join with code</Text></Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {circles.map((c) => (
          <Pressable key={c.id} style={[s.tab, active?.id === c.id && s.tabActive]} onPress={() => setActive(c)}>
            <Text style={[s.tabText, active?.id === c.id && { color: theme.colors.primaryDark }]}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {active && (
        <>
          <View style={s.codeCard}>
            <Text style={s.p}>Invite code</Text>
            <Text style={s.code}>{active.invite_code}</Text>
          </View>

          <Text style={s.section}>Leaderboard</Text>
          {board.map((r, i) => (
            <View key={r.user_id} style={s.row}>
              <Text style={s.rank}>{i + 1}</Text>
              <Text style={s.avatar}>{r.avatar_emoji ?? "🕌"}</Text>
              <Text style={s.rowName}>{r.display_name ?? r.username}</Text>
              <Text style={s.streak}>🔥 {r.current_streak}</Text>
              <Text style={s.noor}>{r.noor_score}</Text>
            </View>
          ))}

          <Text style={s.section}>Activity</Text>
          {feed.map((f) => (
            <View key={f.id} style={s.feedRow}>
              <Text style={s.feedAvatar}>{f.profiles?.avatar_emoji ?? "🕌"}</Text>
              <Text style={s.feedText}>
                <Text style={{ fontWeight: "700", color: theme.colors.text }}>{f.profiles?.display_name ?? f.profiles?.username ?? "Someone"}</Text>{" "}
                {(kindText[f.kind] ?? (() => f.kind))(f.payload)}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  h1: { color: theme.colors.text, fontSize: 28, fontWeight: "800", marginBottom: 8 },
  p: { color: theme.colors.textDim, fontSize: 14, marginBottom: 14, lineHeight: 20 },
  input: { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md, padding: 14, marginBottom: 10 },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, padding: 14, alignItems: "center" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.surface2 },
  btnText: { color: theme.colors.primaryDark, fontWeight: "700" },
  btnTextGhost: { color: theme.colors.textDim },
  or: { color: theme.colors.textFaint, textAlign: "center", marginVertical: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.surface2, borderRadius: theme.radius.pill, marginRight: 8 },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { color: theme.colors.text, fontWeight: "600" },
  codeCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginBottom: 20 },
  code: { color: theme.colors.gold, fontSize: 26, fontWeight: "800", letterSpacing: 4 },
  section: { color: theme.colors.textDim, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, marginBottom: 6 },
  rank: { color: theme.colors.textFaint, width: 20, fontWeight: "700" },
  avatar: { fontSize: 20, marginHorizontal: 8 },
  rowName: { color: theme.colors.text, flex: 1, fontWeight: "600" },
  streak: { color: theme.colors.gold, marginRight: 12 },
  noor: { color: theme.colors.primary, fontWeight: "800", width: 34, textAlign: "right" },
  feedRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 8 },
  feedAvatar: { fontSize: 18, marginRight: 10 },
  feedText: { color: theme.colors.textDim, flex: 1, lineHeight: 20 },
});
