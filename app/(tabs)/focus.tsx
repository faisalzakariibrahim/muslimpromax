import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { router } from "expo-router";
import { theme } from "@/lib/theme";
import ScreenTime from "@modules/screen-time";
import {
  ensureAuthorized,
  chooseBlockedApps,
  setMode,
  armForToday,
  disableFocus,
  blockNow,
  unblockNow,
  FocusMode,
} from "@/features/blocking/salahFocus";

export default function Focus() {
  const supported = ScreenTime.isSupported();
  const [authorized, setAuthorized] = useState(false);
  const [summary, setSummary] = useState({ applications: 0, categories: 0, webDomains: 0 });
  const [mode, setModeState] = useState<FocusMode>("honor");
  const [armed, setArmed] = useState(0);
  const [brick, setBrick] = useState(false);

  useEffect(() => {
    setAuthorized(ScreenTime.authorizationStatus() === "approved");
    setSummary(ScreenTime.getSelectionSummary());
  }, []);

  const authorize = async () => {
    const ok = await ensureAuthorized();
    setAuthorized(ok);
    if (!ok) Alert.alert("Screen Time needed", "Allow Screen Time access to block apps during salah.");
  };
  const pick = async () => setSummary(await chooseBlockedApps());
  const toggleMode = (m: FocusMode) => {
    setModeState(m);
    setMode(m);
  };
  const arm = async () => {
    const n = await armForToday();
    setArmed(n);
    Alert.alert("Salah Focus armed", `Blocking is scheduled for ${n} prayer windows today.`);
  };
  const toggleBrick = (on: boolean) => {
    setBrick(on);
    on ? blockNow() : unblockNow();
  };

  if (!supported) {
    return (
      <View style={[s.wrap, { justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Text style={s.title}>Focus needs a real iPhone</Text>
        <Text style={s.p}>App blocking uses Apple's Screen Time API, which isn't available on the Simulator or Android. Run a device build to use it.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <Text style={s.h1}>Salah Focus</Text>
      <Text style={s.p}>Lock distracting apps while it's time to pray. Choices stay private — even from us.</Text>

      <Step n={1} title="Allow Screen Time" done={authorized}>
        <Pressable style={[s.btn, authorized && s.btnGhost]} onPress={authorize}>
          <Text style={[s.btnText, authorized && s.btnTextGhost]}>{authorized ? "Allowed ✓" : "Allow access"}</Text>
        </Pressable>
      </Step>

      <Step n={2} title="Pick apps to block" done={summary.applications + summary.categories > 0}>
        <Pressable style={s.btn} onPress={pick} disabled={!authorized}>
          <Text style={s.btnText}>
            {summary.applications + summary.categories > 0
              ? `${summary.applications} apps · ${summary.categories} categories`
              : "Choose apps"}
          </Text>
        </Pressable>
      </Step>

      <Step n={3} title="Unlock mode" done>
        <View style={s.modeRow}>
          <ModeChip label="Honor" sub="Tap “I prayed”" active={mode === "honor"} onPress={() => toggleMode("honor")} />
          <ModeChip label="Proof" sub="Scan with camera" active={mode === "proof"} onPress={() => toggleMode("proof")} />
        </View>
        {mode === "proof" && (
          <Pressable style={[s.btn, { marginTop: 10 }]} onPress={() => router.push("/verify")}>
            <Text style={s.btnText}>📷 Verify prayer with Proof Mode</Text>
          </Pressable>
        )}
      </Step>

      <Step n={4} title="Arm for today" done={armed > 0}>
        <Pressable style={s.btn} onPress={arm} disabled={!authorized}>
          <Text style={s.btnText}>{armed > 0 ? `Armed · ${armed} windows ✓` : "Schedule all 5 prayers"}</Text>
        </Pressable>
        <Pressable style={[s.btn, s.btnGhost, { marginTop: 8 }]} onPress={disableFocus}>
          <Text style={[s.btnText, s.btnTextGhost]}>Turn off scheduled focus</Text>
        </Pressable>
      </Step>

      <View style={s.brickCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.brickTitle}>🧱 Brick Mode</Text>
          <Text style={s.p}>Block everything right now for deep focus.</Text>
        </View>
        <Switch value={brick} onValueChange={toggleBrick} disabled={!authorized} trackColor={{ true: theme.colors.primary }} />
      </View>
    </ScrollView>
  );
}

function Step({ n, title, done, children }: any) {
  return (
    <View style={s.step}>
      <View style={s.stepHead}>
        <View style={[s.badge, done && { backgroundColor: theme.colors.primary }]}>
          <Text style={[s.badgeText, done && { color: theme.colors.primaryDark }]}>{done ? "✓" : n}</Text>
        </View>
        <Text style={s.stepTitle}>{title}</Text>
      </View>
      <View style={{ paddingLeft: 36 }}>{children}</View>
    </View>
  );
}
function ModeChip({ label, sub, active, onPress }: any) {
  return (
    <Pressable style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipLabel, active && { color: theme.colors.primaryDark }]}>{label}</Text>
      <Text style={[s.chipSub, active && { color: theme.colors.primaryDark }]}>{sub}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  h1: { color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  p: { color: theme.colors.textDim, fontSize: 14, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  step: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginBottom: 12 },
  stepHead: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.surface2, alignItems: "center", justifyContent: "center", marginRight: 12 },
  badgeText: { color: theme.colors.text, fontWeight: "700", fontSize: 12 },
  stepTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, padding: 14, alignItems: "center" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.surface2 },
  btnText: { color: theme.colors.primaryDark, fontWeight: "700" },
  btnTextGhost: { color: theme.colors.textDim },
  modeRow: { flexDirection: "row", gap: 10 },
  chip: { flex: 1, backgroundColor: theme.colors.surface2, borderRadius: theme.radius.md, padding: 14, alignItems: "center" },
  chipActive: { backgroundColor: theme.colors.primary },
  chipLabel: { color: theme.colors.text, fontWeight: "700", fontSize: 15 },
  chipSub: { color: theme.colors.textFaint, fontSize: 12, marginTop: 2 },
  brickCard: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginTop: 8 },
  brickTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
});
