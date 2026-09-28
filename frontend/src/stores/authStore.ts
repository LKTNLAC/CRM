import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MeResponse } from "@/services/auth";

interface AuthState {
  user: MeResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: MeResponse | null) => void;
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        set({ accessToken, refreshToken });
      },
      clear: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "auth-store", partialize: (s) => ({ user: s.user }) }
  )
);