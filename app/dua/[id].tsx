import { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentHeader } from "@/features/content/ContentHeader";
import { getDuaCategory } from "@/features/content/dua";
import { theme } from "@/lib/theme";

export default function DuaCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cat = useMemo(() => getDuaCategory(Number(id)), [id]);

  if (!cat) {
    return (
      <View style={s.wrap}>
        <ContentHeader title="Dua" />
        <Text style={s.missing}>Category not found.</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <ContentHeader title={cat.titleEn ?? cat.title} subtitle={cat.titleEn ? cat.title : undefined} />
      <FlatList
        data={cat.items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <View style={s.card}>
            <View style={s.head}>
              <Text style={s.idx}>{index + 1}</Text>
              {item.count > 1 ? <Text style={s.count}>×{item.count}</Text> : null}
            </View>
            <Text style={s.ar}>{item.ar}</Text>
            {item.note ? <Text style={s.note}>{item.note}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  missing: { color: theme.colors.textDim, padding: 24 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 10 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  idx: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
  count: { color: theme.colors.gold, fontSize: 13, fontWeight: "700" },
  ar: { color: theme.colors.text, fontSize: 22, lineHeight: 44, textAlign: "right", writingDirection: "rtl" },
  note: { color: theme.colors.textDim, fontSize: 13, marginTop: 12, lineHeight: 19, writingDirection: "rtl", textAlign: "right" },
});
