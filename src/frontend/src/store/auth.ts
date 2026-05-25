import type { AppMode, UserRole } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  apartmentId?: string;
  flatId?: string;
  principal?: string;
  apartmentName?: string;
  watchmanAssigned?: boolean;
}

/** Derive the primary app mode from a user's role */
function deriveMode(role: UserRole): AppMode {
  switch (role) {
    case "founder":
    case "co_founder":
    case "employee":
      return "founder";
    case "family_member":
      return "family";
    case "watchman":
    case "watchman_family":
      return "watchman";
    default:
      return "apartment";
  }
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  currentMode: AppMode | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  setMode: (mode: AppMode) => void;
  setApartment: (apartmentId: string) => void;
  setFlat: (flatId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      currentMode: null,

      login: (user) =>
        set({
          user,
          isLoggedIn: true,
          currentMode: deriveMode(user.role),
        }),

      logout: () => set({ user: null, isLoggedIn: false, currentMode: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setMode: (mode) => set({ currentMode: mode }),

      setApartment: (apartmentId) =>
        set((state) =>
          state.user ? { user: { ...state.user, apartmentId } } : {},
        ),

      setFlat: (flatId) =>
        set((state) => (state.user ? { user: { ...state.user, flatId } } : {})),
    }),
    {
      name: "develvyn-auth",
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        currentMode: state.currentMode,
      }),
    },
  ),
);
