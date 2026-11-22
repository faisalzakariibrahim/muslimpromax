import { Tabs } from "expo-router";
import { Text } from "react-native";
import { theme } from "@/lib/theme";

function Icon({ e, color }: { e: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{e}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.surface2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color }) => <Icon e="🏮" color={color} /> }} />
      <Tabs.Screen name="focus" options={{ title: "Focus", tabBarIcon: ({ color }) => <Icon e="🛡️" color={color} /> }} />
      <Tabs.Screen name="circle" options={{ title: "Circle", tabBarIcon: ({ color }) => <Icon e="🤲" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <Icon e="📖" color={color} /> }} />
    </Tabs>
  );
}
