import { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentHeader } from "@/features/content/ContentHeader";
import { getSurah } from "@/features/content/quran";
import { theme } from "@/lib/theme";

export default function SurahReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surah = useMemo(() => getSurah(Number(id)), [id]);

  if (!surah) {
    return (
      <View style={s.wrap}>
        <ContentHeader title="Surah" />
        <Text style={s.missing}>Surah not found.</Text>
      </View>
    );
  }

  // Basmala prefixes every surah except At-Tawbah (9); Al-Fatihah (1) includes it as ayah 1.
  const showBasmala = surah.id !== 1 && surah.id !== 9;

  return (
    <View style={s.wrap}>
      <ContentHeader title={surah.transliteration} subtitle={`${surah.translation} · ${surah.total} ayahs`} />
      <FlatList
        data={surah.verses}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          showBasmala ? (
            <Text style={s.basmala}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.ayah}>
            <Text style={s.ar}>
              {item.ar} <Text style={s.ayahNum}>﴿{item.id}﴾</Text>
            </Text>
            <Text style={s.tr}>{item.tr}</Text>
            <Text style={s.en}>{item.en}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  missing: { color: theme.colors.textDim, padding: 24 },
  basmala: { color: theme.colors.gold, fontSize: 24, textAlign: "center", marginBottom: 20, writingDirection: "rtl", lineHeight: 44 },
  ayah: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 10 },
  ar: { color: theme.colors.text, fontSize: 24, lineHeight: 46, textAlign: "right", writingDirection: "rtl" },
  ayahNum: { color: theme.colors.primary, fontSize: 16 },
  tr: { color: theme.colors.gold, fontSize: 14, marginTop: 12, fontStyle: "italic", lineHeight: 20 },
  en: { color: theme.colors.textDim, fontSize: 15, marginTop: 8, lineHeight: 22 },
});
