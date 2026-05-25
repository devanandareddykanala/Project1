import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  isOnboardingSeen: boolean;
  notificationCounts: Record<string, number>;
  markOnboardingSeen: () => void;
  setNotificationCount: (key: string, count: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboardingSeen: false,
      notificationCounts: {},

      markOnboardingSeen: () => set({ isOnboardingSeen: true }),

      setNotificationCount: (key, count) =>
        set((state) => ({
          notificationCounts: { ...state.notificationCounts, [key]: count },
        })),
    }),
    {
      name: "develvyn-app",
      partialize: (state) => ({
        isOnboardingSeen: state.isOnboardingSeen,
      }),
    },
  ),
);
