import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { router } from "expo-router";
import { ContentHeader } from "@/features/content/ContentHeader";
import { listDuaCategories } from "@/features/content/dua";
import { theme } from "@/lib/theme";

export default function DuaList() {
  const cats = listDuaCategories();
  return (
    <View style={s.wrap}>
      <ContentHeader title="Dua & Adhkar" subtitle={`${cats.length} categories · Hisnul Muslim`} />
      <FlatList
        data={cats}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable style={s.row} onPress={() => router.push(`/dua/${item.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.titleEn ?? item.title}</Text>
              {item.titleEn ? <Text style={s.ar}>{item.title}</Text> : null}
            </View>
            <Text style={s.count}>{item.items.length}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 15, marginBottom: 8 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: "600" },
  ar: { color: theme.colors.gold, fontSize: 15, marginTop: 3, writingDirection: "rtl", textAlign: "right" },
  count: { color: theme.colors.textFaint, fontSize: 13, marginLeft: 10 },
});
