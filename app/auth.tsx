import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { signInWithEmail, verifyOtp } from "@/features/auth/useSession";
import { theme } from "@/lib/theme";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert("Could not send code", e.message);
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    setBusy(true);
    try {
      await verifyOtp(email.trim(), code.trim());
    } catch (e: any) {
      Alert.alert("Invalid code", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.lantern}>🏮</Text>
      <Text style={s.title}>MuslimProMax</Text>
      <Text style={s.sub}>Pray on time. Scroll less. Keep your light.</Text>

      {!sent ? (
        <>
          <TextInput
            style={s.input}
            placeholder="you@email.com"
            placeholderTextColor={theme.colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable style={s.btn} onPress={send} disabled={busy || !email}>
            <Text style={s.btnText}>{busy ? "…" : "Send code"}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            style={s.input}
            placeholder="6-digit code"
            placeholderTextColor={theme.colors.textFaint}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <Pressable style={s.btn} onPress={verify} disabled={busy || !code}>
            <Text style={s.btnText}>{busy ? "…" : "Verify"}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center", padding: 28 },
  lantern: { fontSize: 64, marginBottom: 8 },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: "800" },
  sub: { color: theme.colors.textDim, fontSize: 15, marginTop: 6, marginBottom: 28, textAlign: "center" },
  input: { width: "100%", backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md, padding: 16, fontSize: 16, marginBottom: 12 },
  btn: { width: "100%", backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, padding: 16, alignItems: "center" },
  btnText: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: "700" },
});
