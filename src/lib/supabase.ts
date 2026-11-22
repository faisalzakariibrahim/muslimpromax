import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { SecureStorage } from "./secureStorage";

const url = Constants.expoConfig?.extra?.supabaseUrl as string;
const anon = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!url || !anon) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url ?? "", anon ?? "", {
  auth: {
    storage: SecureStorage, // Keychain/Keystore, not plaintext AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
