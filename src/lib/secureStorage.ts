import * as SecureStore from "expo-secure-store";

/**
 * Keychain/Keystore-backed storage for the Supabase auth session.
 *
 * Why not AsyncStorage: it's an unencrypted on-disk store. Auth tokens there can
 * be read from a jailbroken device or an unencrypted backup. SecureStore keeps
 * them in the iOS Keychain / Android Keystore instead.
 *
 * Why chunking: SecureStore enforces a ~2KB value limit (Android), and a
 * Supabase session (JWT + refresh token) can exceed that. We transparently split
 * the value across numbered Keychain entries.
 */
const CHUNK = 1800;
const meta = (k: string) => `${k}__n`;
const part = (k: string, i: number) => `${k}__${i}`;

export const SecureStorage = {
  async getItem(key: string): Promise<string | null> {
    const n = await SecureStore.getItemAsync(meta(key));
    if (!n) return null;
    const count = parseInt(n, 10);
    let out = "";
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(part(key, i));
      if (chunk == null) return null; // corrupt/partial — treat as signed out
      out += chunk;
    }
    return out;
  },

  async setItem(key: string, value: string): Promise<void> {
    await this.removeItem(key);
    const count = Math.max(1, Math.ceil(value.length / CHUNK));
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(part(key, i), value.slice(i * CHUNK, (i + 1) * CHUNK), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK, // usable in background refresh
      });
    }
    await SecureStore.setItemAsync(meta(key), String(count));
  },

  async removeItem(key: string): Promise<void> {
    const n = await SecureStore.getItemAsync(meta(key));
    if (n) {
      const count = parseInt(n, 10);
      for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(part(key, i));
    }
    await SecureStore.deleteItemAsync(meta(key));
  },
};
