import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  signInWithApple,
  appleSignInAvailable,
  signInWithEmail,
  verifyOtp,
} from "@/features/auth/useSession";
import { theme } from "@/lib/theme";

export default function Auth() {
  const [apple, setApple] = useState(false);
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    appleSignInAvailable().then(setApple);
  }, []);

  const doApple = async () => {
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") Alert.alert("Sign in failed", e.message);
    }
  };
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

      <View style={s.card}>
        {!useEmail ? (
          <>
            {apple && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={999}
                style={s.apple}
                onPress={doApple}
              />
            )}
            <Pressable style={[s.btn, apple && s.btnGhost]} onPress={() => setUseEmail(true)}>
              <Text style={[s.btnText, apple && s.btnTextGhost]}>Continue with email</Text>
            </Pressable>
          </>
        ) : !sent ? (
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
            <Pressable style={s.link} onPress={() => setUseEmail(false)}>
              <Text style={s.linkText}>Back</Text>
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

      <Text style={s.legal}>
        No passwords. Your session is stored in the device Keychain, and your prayer data is yours alone.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center", padding: 28 },
  lantern: { fontSize: 64, marginBottom: 8 },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: "800" },
  sub: { color: theme.colors.textDim, fontSize: 15, marginTop: 6, marginBottom: 28, textAlign: "center" },
  card: { width: "100%", gap: 12 },
  apple: { width: "100%", height: 52 },
  input: { width: "100%", backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md, padding: 16, fontSize: 16 },
  btn: { width: "100%", backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, padding: 16, alignItems: "center" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.surface2 },
  btnText: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: "700" },
  btnTextGhost: { color: theme.colors.textDim },
  link: { padding: 8, alignItems: "center" },
  linkText: { color: theme.colors.textDim, fontWeight: "600" },
  legal: { color: theme.colors.textFaint, fontSize: 12, textAlign: "center", marginTop: 24, lineHeight: 18, paddingHorizontal: 12 },
});
