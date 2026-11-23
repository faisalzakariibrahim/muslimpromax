import index from "./data/quran-index.json";

/**
 * Qur'an content — fully offline, authentic (Tanzil text via the `quran-json`
 * dataset, generated into ./data at build time). No network, no API.
 * The 13KB index powers the surah list; the full 2.9MB text loads lazily the
 * first time a surah is opened.
 */
export type SurahMeta = {
  id: number;
  name: string; // Arabic
  transliteration: string; // e.g. "Al-Fatihah"
  translation: string; // e.g. "The Opener"
  type: "meccan" | "medinan";
  total: number; // number of ayahs
};
export type Ayah = { id: number; ar: string; en: string; tr: string };
export type Surah = SurahMeta & { verses: Ayah[] };

export function listSurahs(): SurahMeta[] {
  return index as SurahMeta[];
}

let full: Surah[] | null = null;
export function getSurah(id: number): Surah | undefined {
  if (!full) full = require("./data/quran.json") as Surah[];
  return full.find((s) => s.id === id);
}

export function searchSurahs(q: string): SurahMeta[] {
  const s = q.trim().toLowerCase();
  if (!s) return listSurahs();
  return listSurahs().filter(
    (x) =>
      x.transliteration.toLowerCase().includes(s) ||
      x.translation.toLowerCase().includes(s) ||
      String(x.id) === s
  );
}
