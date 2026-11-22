import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { supabase } from "../../lib/supabase";
import { useAppStore } from "../../lib/store";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) useAppStore.getState().reset();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/** True only on a real iOS device where Apple sign-in is offered. */
export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Sign in with Apple — Keychain-backed, no shared secret, private-relay email.
 * We bind the request with a nonce: send SHA-256(nonce) to Apple and the raw
 * nonce to Supabase, so a stolen identity token can't be replayed.
 */
export async function signInWithApple(): Promise<void> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!credential.identityToken) throw new Error("No identity token from Apple");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Apple returns the name ONLY on first authorization — capture it right away.
  if (credential.fullName?.givenName) {
    const display = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(" ");
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("profiles").update({ display_name: display }).eq("id", u.user.id);
    }
  }
}

/** Passwordless email fallback (one-time code). */
export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}
export async function verifyOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
