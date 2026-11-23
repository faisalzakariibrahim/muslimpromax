import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { theme } from "../../lib/theme";

export function ContentHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
      <Pressable style={s.back} onPress={() => router.back()} hitSlop={10}>
        <Text style={s.backText}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10, backgroundColor: theme.colors.bg, borderBottomWidth: 1, borderBottomColor: theme.colors.line ?? "rgba(255,255,255,0.06)" },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" },
  backText: { color: theme.colors.text, fontSize: 26, lineHeight: 28, marginTop: -2 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: "700" },
  sub: { color: theme.colors.textDim, fontSize: 12, marginTop: 1 },
});
