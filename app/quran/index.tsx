import { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, TextInput } from "react-native";
import { router } from "expo-router";
import { ContentHeader } from "@/features/content/ContentHeader";
import { listSurahs, searchSurahs } from "@/features/content/quran";
import { theme } from "@/lib/theme";

export default function QuranList() {
  const [q, setQ] = useState("");
  const data = useMemo(() => searchSurahs(q), [q]);

  return (
    <View style={s.wrap}>
      <ContentHeader title="Qur'an" subtitle={`${listSurahs().length} surahs · offline`} />
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          placeholder="Search surah…"
          placeholderTextColor={theme.colors.textFaint}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={data}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        renderItem={({ item }) => (
          <Pressable style={s.row} onPress={() => router.push(`/quran/${item.id}`)}>
            <View style={s.num}><Text style={s.numText}>{item.id}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.transliteration}</Text>
              <Text style={s.meta}>{item.translation} · {item.total} ayahs · {item.type}</Text>
            </View>
            <Text style={s.ar}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  search: { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md, padding: 12, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 14, marginBottom: 8, gap: 12 },
  num: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.surface2, alignItems: "center", justifyContent: "center" },
  numText: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  meta: { color: theme.colors.textDim, fontSize: 12, marginTop: 2 },
  ar: { color: theme.colors.gold, fontSize: 20 },
});
