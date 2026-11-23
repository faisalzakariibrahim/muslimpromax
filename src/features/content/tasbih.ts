import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Tasbih — a digital dhikr counter. The phrases below are the universally-known
 * core adhkar; Arabic is short and canonical. Lifetime totals persist per phrase.
 */
export type Dhikr = {
  id: string;
  ar: string;
  translit: string;
  meaning: string;
  target: number; // suggested count per round
};

export const DHIKR: Dhikr[] = [
  { id: "subhanallah", ar: "سُبْحَانَ اللَّه", translit: "SubhanAllah", meaning: "Glory be to Allah", target: 33 },
  { id: "alhamdulillah", ar: "الْحَمْدُ لِلَّه", translit: "Alhamdulillah", meaning: "All praise is due to Allah", target: 33 },
  { id: "allahuakbar", ar: "اللَّهُ أَكْبَر", translit: "Allahu Akbar", meaning: "Allah is the Greatest", target: 34 },
  { id: "tahlil", ar: "لَا إِلَٰهَ إِلَّا اللَّه", translit: "La ilaha illallah", meaning: "There is no god but Allah", target: 100 },
  { id: "astaghfirullah", ar: "أَسْتَغْفِرُ اللَّه", translit: "Astaghfirullah", meaning: "I seek forgiveness from Allah", target: 100 },
  { id: "hamdala-tasbih", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", translit: "SubhanAllahi wa bihamdihi", meaning: "Glory and praise be to Allah", target: 100 },
];

const KEY = "mpm.tasbihTotals";

export async function loadTotals(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function addToTotal(id: string, delta = 1): Promise<number> {
  const totals = await loadTotals();
  totals[id] = (totals[id] ?? 0) + delta;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(totals));
  } catch {
    /* non-fatal */
  }
  return totals[id];
}
