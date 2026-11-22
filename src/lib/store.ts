import { create } from "zustand";
import { supabase } from "./supabase";

type AppState = {
  onboarded: boolean | null; // null = unknown/loading
  setOnboarded: (v: boolean) => void;
  loadOnboarded: (userId: string) => Promise<void>;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  onboarded: null,
  setOnboarded: (v) => set({ onboarded: v }),
  loadOnboarded: async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", userId)
      .single();
    set({ onboarded: !!data?.onboarded });
  },
  reset: () => set({ onboarded: null }),
}));
