import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { theme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { ensureAuthorized } from "@/features/blocking/salahFocus";

const EMOJIS = ["🏮", "🕌", "🌙", "⭐️", "🤲", "📿", "🕋", "☪️"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏮");
  const [busy, setBusy] = useState(false);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const finish = async () => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase
          .from("profiles")
          .update({
            display_name: name.trim() || null,
            avatar_emoji: emoji,
            onboarded: true,
          })
          .eq("id", u.user.id);
      }
      setOnboarded(true);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Could not save", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.content}>
      <View style={s.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.dot, i === step && s.dotActive]} />
        ))}
      </View>

      {step === 0 && (
        <>
          <Text style={s.h1}>Assalamu alaikum 👋</Text>
          <Text style={s.p}>What should your circle call you?</Text>
          <TextInput
            style={s.input}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textFaint}
            value={name}
            onChangeText={setName}
          />
          <Text style={[s.p, { marginTop: 20 }]}>Pick your mark</Text>
          <View style={s.emojiRow}>
            {EMOJIS.map((e) => (
              <Pressable key={e} style={[s.emoji, emoji === e && s.emojiActive]} onPress={() => setEmoji(e)}>
                <Text style={{ fontSize: 26 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={s.btn} onPress={() => setStep(1)}>
            <Text style={s.btnText}>Continue</Text>
          </Pressable>
        </>
      )}

      {step === 1 && (
        <>
          <Text style={s.h1}>A few permissions 🔐</Text>
          <Text style={s.p}>
            We ask only for what each feature needs, and we explain why first. You can change any of these later in Settings.
          </Text>

          <Prime
            icon="🛡️"
            title="Screen Time"
            why="Lets MuslimProMax lock distracting apps during salah. Your app choices stay private — Apple never tells us which apps you picked."
            onAllow={async () => {
              await ensureAuthorized();
            }}
          />
          <Prime
            icon="🔔"
            title="Notifications"
            why="Prayer-time reminders and the gentle nudge to verify after you pray."
            onAllow={async () => {
              await Notifications.requestPermissionsAsync();
            }}
          />
          <Prime
            icon="📍"
            title="Location"
            why="Used only to calculate accurate prayer times and the Qibla for where you are. Never shared."
            onAllow={async () => {
              await Location.requestForegroundPermissionsAsync();
            }}
          />

          <Pressable style={s.btn} onPress={() => setStep(2)}>
            <Text style={s.btnText}>Continue</Text>
          </Pressable>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={s.lantern}>🏮</Text>
          <Text style={s.h1}>You're set</Text>
          <Text style={s.p}>
            Keep your Noor bright: pray on time, scroll less. Start a Prayer Circle with family to stay accountable together.
          </Text>
          <Pressable style={s.btn} onPress={finish} disabled={busy}>
            <Text style={s.btnText}>{busy ? "…" : "Enter MuslimProMax"}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function Prime({ icon, title, why, onAllow }: { icon: string; title: string; why: string; onAllow: () => Promise<void> }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <View style={s.prime}>
      <Text style={s.primeIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.primeTitle}>{title}</Text>
        <Text style={s.primeWhy}>{why}</Text>
      </View>
      <Pressable
        style={[s.allow, done && s.allowDone]}
        disabled={done || busy}
        onPress={async () => {
          setBusy(true);
          try {
            await onAllow();
            setDone(true);
          } catch {
            /* user can proceed regardless */
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={[s.allowText, done && { color: theme.colors.primaryDark }]}>{done ? "✓" : "Allow"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 28, paddingTop: 80, flexGrow: 1 },
  dots: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.surface2 },
  dotActive: { backgroundColor: theme.colors.primary, width: 22 },
  lantern: { fontSize: 64, textAlign: "center", marginBottom: 8 },
  h1: { color: theme.colors.text, fontSize: 26, fontWeight: "800", textAlign: "center" },
  p: { color: theme.colors.textDim, fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 21 },
  input: { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md, padding: 16, fontSize: 16, marginTop: 16 },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 12 },
  emoji: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  emojiActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface2 },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, padding: 16, alignItems: "center", marginTop: 32 },
  btnText: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: "700" },
  prime: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginTop: 12, gap: 12 },
  primeIcon: { fontSize: 26 },
  primeTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  primeWhy: { color: theme.colors.textDim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  allow: { backgroundColor: theme.colors.surface2, borderRadius: theme.radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  allowDone: { backgroundColor: theme.colors.primary },
  allowText: { color: theme.colors.text, fontWeight: "700" },
});
