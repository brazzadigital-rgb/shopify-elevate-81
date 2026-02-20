import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HideValuesState {
  hidden: boolean;
  toggle: () => void;
}

export const useHideValues = create<HideValuesState>()(
  persist(
    (set) => ({
      hidden: false,
      toggle: () => set((s) => ({ hidden: !s.hidden })),
    }),
    { name: "seller-hide-values" }
  )
);

export const HIDDEN_PLACEHOLDER = "••••••";
