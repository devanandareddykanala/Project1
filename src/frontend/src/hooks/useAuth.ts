import { createActor, loginWithII } from "@/lib/backend";
import { useAuthStore } from "@/store/auth";
import { ROLE_LABELS, ROLE_MODE_ACCESS } from "@/types";
import type { AppMode } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";

export function useAuth() {
  const {
    user,
    isLoggedIn,
    isLoading,
    currentMode,
    login,
    logout,
    setMode,
    setLoading,
  } = useAuthStore();
  const { actor } = useActor(createActor);
  const navigate = useNavigate();

  /** handleLoginWithII — Internet Identity login */
  const handleLoginWithII = async (): Promise<void> => {
    if (!actor) return;
    setLoading(true);
    try {
      const authUser = await loginWithII(actor);
      if (!authUser) return;
      login(authUser);
      const modes = ["apartment", "family", "watchman", "founder"] as const;
      const accessible = modes.find(
        (m) => ROLE_MODE_ACCESS[authUser.role]?.[m],
      );
      if (accessible === "watchman") {
        await navigate({ to: "/watchman" });
        return;
      }
      if (accessible === "founder") {
        await navigate({ to: "/founder" });
        return;
      }
      if (accessible === "family") {
        await navigate({ to: "/family" });
        return;
      }
      await navigate({ to: "/apartment" });
    } finally {
      setLoading(false);
    }
  };

  const availableModes = user
    ? (Object.entries(ROLE_MODE_ACCESS[user.role]) as [AppMode, boolean][])
        .filter(([, allowed]) => allowed)
        .map(([mode]) => mode)
    : [];

  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  return {
    user,
    isLoggedIn,
    isLoading,
    currentMode,
    roleLabel,
    availableModes,
    loginWithII: handleLoginWithII,
    logout,
    setMode,
  };
}
