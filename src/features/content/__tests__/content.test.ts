import { listSurahs, getSurah } from "../quran";
import { listDuaCategories, getDuaCategory } from "../dua";

describe("Qur'an data integrity", () => {
  it("has all 114 surahs in order", () => {
    const list = listSurahs();
    expect(list).toHaveLength(114);
    expect(list[0].transliteration).toBe("Al-Fatihah");
    expect(list.map((s) => s.id)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
  });

  it("Al-Fatihah has 7 ayahs, each with Arabic, English and transliteration", () => {
    const s = getSurah(1)!;
    expect(s.verses).toHaveLength(7);
    for (const v of s.verses) {
      expect(v.ar.length).toBeGreaterThan(0);
      expect(v.en.length).toBeGreaterThan(0);
      expect(v.tr.length).toBeGreaterThan(0);
    }
  });

  it("verse counts match each surah's declared total", () => {
    for (const meta of listSurahs()) {
      expect(getSurah(meta.id)!.verses).toHaveLength(meta.total);
    }
  });

  it("Al-Baqarah is surah 2 with 286 ayahs", () => {
    expect(getSurah(2)!.verses).toHaveLength(286);
  });
});

describe("Dua / Adhkar data integrity", () => {
  it("loads categories, each with at least one Arabic supplication", () => {
    const cats = listDuaCategories();
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.items.length).toBeGreaterThan(0);
      expect(c.items.every((i) => i.ar.length > 0 && i.count >= 1)).toBe(true);
    }
  });

  it("exposes the morning adhkar category with multiple items", () => {
    const morning = getDuaCategory(1);
    expect(morning).toBeDefined();
    expect(morning!.items.length).toBeGreaterThan(5);
  });
});
