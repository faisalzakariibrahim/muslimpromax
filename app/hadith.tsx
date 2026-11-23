import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ContentHeader } from "@/features/content/ContentHeader";
import { theme } from "@/lib/theme";

/**
 * Hadith is intentionally not populated with hand-entered text. Hadith are
 * scripture-adjacent and must come from a vetted, correctly-attributed source
 * with authentic grading — so this screen is wired and waiting for that dataset
 * (a licensed sunnah.com export or an equivalent JSON you trust) rather than
 * shipping unverified content.
 */
const COLLECTIONS = [
  { name: "Al-Arba'in an-Nawawi", detail: "Imam an-Nawawi's 40 Hadith", count: "42 hadith" },
  { name: "Riyad as-Salihin", detail: "The Gardens of the Righteous", count: "1,896 hadith" },
  { name: "Sahih al-Bukhari", detail: "The most authentic collection", count: "97 books" },
];

export default function Hadith() {
  return (
    <View style={s.wrap}>
      <ContentHeader title="Hadith" subtitle="Authentic collections" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.notice}>
          <Text style={s.noticeTitle}>Coming from a verified source</Text>
          <Text style={s.noticeText}>
            The reader is built. We're loading these collections from an authenticated,
            properly-graded dataset rather than typing hadith by hand — so every narration
            carries its correct chain and grading.
          </Text>
        </View>
        {COLLECTIONS.map((c) => (
          <View key={c.name} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{c.name}</Text>
              <Text style={s.detail}>{c.detail}</Text>
            </View>
            <Text style={s.count}>{c.count}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  notice: { backgroundColor: theme.colors.surface2, borderRadius: theme.radius.lg, padding: 16, marginBottom: 16 },
  noticeTitle: { color: theme.colors.gold, fontWeight: "700", fontSize: 15 },
  noticeText: { color: theme.colors.textDim, fontSize: 13, marginTop: 6, lineHeight: 19 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 8, opacity: 0.7 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  detail: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  count: { color: theme.colors.textFaint, fontSize: 12 },
});
