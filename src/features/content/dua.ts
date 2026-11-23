import data from "./data/duas.json";

/**
 * Dua / Adhkar — authentic Arabic supplications from the Hisnul-Muslim-style
 * `azkar` dataset (134 categories), bundled offline. English translations are a
 * follow-up; Arabic titles are shown, with English labels for common categories.
 */
export type DuaItem = { ar: string; count: number; note: string | null };
export type DuaCategory = {
  id: number;
  title: string; // Arabic category title
  titleEn: string | null; // English label where available
  items: DuaItem[];
};

export function listDuaCategories(): DuaCategory[] {
  return data as DuaCategory[];
}

export function getDuaCategory(id: number): DuaCategory | undefined {
  return (data as DuaCategory[]).find((c) => c.id === id);
}
