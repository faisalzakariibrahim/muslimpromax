import { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import { router } from "expo-router";
import { theme } from "@/lib/theme";
import { verifyPrayerImage, VerifyResult } from "@/features/verify/verifyPrayer";
import { prayerTimesFor, currentPrayer, DEFAULT_CONFIG } from "@/lib/prayerTimes";
import { logPrayer, recomputeStreak } from "@/features/prayer/prayerLog";

type Phase = "camera" | "checking" | "result";

export default function Verify() {
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>("camera");
  const [result, setResult] = useState<VerifyResult | null>(null);

  if (!perm) return <Center><ActivityIndicator color={theme.colors.primary} /></Center>;
  if (!perm.granted) {
    return (
      <Center>
        <Text style={s.title}>Camera access</Text>
        <Text style={s.p}>Proof Mode confirms you prayed by looking at your prayer spot. The photo is analyzed and never stored.</Text>
        <Pressable style={s.btn} onPress={requestPerm}><Text style={s.btnText}>Allow camera</Text></Pressable>
        <Pressable style={s.link} onPress={() => router.back()}><Text style={s.linkText}>Not now</Text></Pressable>
      </Center>
    );
  }

  const capture = async () => {
    try {
      setPhase("checking");
      const shot = await cam.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (!shot?.uri) throw new Error("no_image");

      // Downscale before upload: smaller = faster + cheaper vision call.
      const small = await ImageManipulator.manipulateAsync(
        shot.uri,
        [{ resize: { width: 768 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const res = await verifyPrayerImage(small.base64!);
      setResult(res);
      setPhase("result");

      if (res.passed) {
        // Credit the active prayer window as verified, then refresh the streak.
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const pos =
              (await Location.getLastKnownPositionAsync()) ??
              (await Location.getCurrentPositionAsync({}));
            const times = prayerTimesFor(pos.coords.latitude, pos.coords.longitude, new Date(), DEFAULT_CONFIG);
            const cur = currentPrayer(times);
            await logPrayer({
              name: cur.name,
              scheduledAt: cur.at,
              status: "on_time",
              method: "proof_ai",
              verified: true,
            });
            await recomputeStreak();
          }
        } catch { /* verification already passed; logging is best-effort */ }
      }
    } catch {
      setResult({ passed: false, confidence: 0, reason: "Couldn't read the photo. Try again." });
      setPhase("result");
    }
  };

  if (phase === "result" && result) {
    return (
      <Center>
        <Text style={{ fontSize: 64 }}>{result.passed ? "🟢" : "🔄"}</Text>
        <Text style={s.title}>{result.passed ? "MashaAllah — verified" : "Let's try again"}</Text>
        <Text style={s.p}>{result.reason}</Text>
        {result.passed ? (
          <Pressable style={s.btn} onPress={() => router.back()}><Text style={s.btnText}>Done — apps unlocked</Text></Pressable>
        ) : (
          <>
            <Pressable style={s.btn} onPress={() => setPhase("camera")}><Text style={s.btnText}>Retake photo</Text></Pressable>
            <Pressable style={s.link} onPress={() => router.back()}><Text style={s.linkText}>Cancel</Text></Pressable>
          </>
        )}
      </Center>
    );
  }

  return (
    <View style={s.wrap}>
      <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
      <View style={s.overlay}>
        <Text style={s.hint}>Point at your prayer mat or spot</Text>
        {phase === "checking" ? (
          <View style={s.checking}>
            <ActivityIndicator color={theme.colors.primaryDark} />
            <Text style={s.checkingText}>Verifying…</Text>
          </View>
        ) : (
          <Pressable style={s.shutter} onPress={capture}>
            <View style={s.shutterInner} />
          </Pressable>
        )}
        <Pressable style={s.link} onPress={() => router.back()}><Text style={s.linkText}>Cancel</Text></Pressable>
      </View>
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={[s.wrap, { alignItems: "center", justifyContent: "center", padding: 28 }]}>{children}</View>;
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 48 },
  hint: { color: "#fff", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.pill, marginBottom: "auto", marginTop: 72, overflow: "hidden" },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
  checking: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: theme.radius.pill, flexDirection: "row", alignItems: "center", gap: 10 },
  checkingText: { color: theme.colors.primaryDark, fontWeight: "700" },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "800", marginTop: 12, textAlign: "center" },
  p: { color: theme.colors.textDim, fontSize: 15, textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 21 },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill, paddingVertical: 15, paddingHorizontal: 28, alignItems: "center", minWidth: 220 },
  btnText: { color: theme.colors.primaryDark, fontWeight: "700", fontSize: 16 },
  link: { marginTop: 14, padding: 8 },
  linkText: { color: theme.colors.textDim, fontWeight: "600" },
});
