import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api, { clearToken, getToken, setToken } from "@/lib/api";
import type { AuthResponse, GoogleAuthResponse, GuestAuthResponse, User } from "@/lib/api";

const USER_KEY = "dqa_user";
const GUEST_REMAINING_KEY = "dqa_guest_remaining";

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  guestPromptsRemaining: number;
  setGuestPromptsRemaining: (n: number) => void;
  signInWithGoogle: (credential: string) => Promise<void>;
  signInWithFake: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(!!getToken() && !user);
  const [guestPromptsRemaining, setGuestPromptsRemaining] = useState<number>(() => {
    const raw = localStorage.getItem(GUEST_REMAINING_KEY);
    return raw ? Number(raw) : 2;
  });

  const isGuest = !!user?.user_id?.startsWith("guest:");

  useEffect(() => {
    if (isGuest) localStorage.setItem(GUEST_REMAINING_KEY, String(guestPromptsRemaining));
  }, [isGuest, guestPromptsRemaining]);

  // Hydrate the user from /auth/me when a token exists but no cached user.
  useEffect(() => {
    let cancelled = false;
    if (getToken() && !user) {
      setLoading(true);
      api
        .me()
        .then((u) => {
          if (cancelled) return;
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {
          clearToken();
          localStorage.removeItem(USER_KEY);
        })
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAuthResponse = useCallback((res: AuthResponse) => {
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }, []);

  const signInWithGoogle = useCallback(
    async (credential: string) => {
      const res: GoogleAuthResponse = await api.googleAuth(credential);
      applyAuthResponse(res);
    },
    [applyAuthResponse]
  );

  const signInWithFake = useCallback(async () => {
    const res = await api.fakeLogin();
    applyAuthResponse(res);
  }, [applyAuthResponse]);

  const signInAsGuest = useCallback(async () => {
    const res: GuestAuthResponse = await api.guestLogin();
    applyAuthResponse(res);
    setGuestPromptsRemaining(res.guest_prompts_remaining);
  }, [applyAuthResponse]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      applyAuthResponse(res);
    },
    [applyAuthResponse]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.register(name, email, password);
      applyAuthResponse(res);
    },
    [applyAuthResponse]
  );

  const signOut = useCallback(async () => {
    if (!isGuest) {
      try {
        await api.logout();
      } catch {
        /* best effort */
      }
    }
    clearToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GUEST_REMAINING_KEY);
    setUser(null);
  }, [isGuest]);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isGuest,
      guestPromptsRemaining,
      setGuestPromptsRemaining,
      signInWithGoogle,
      signInWithFake,
      signInAsGuest,
      signInWithPassword,
      signUp,
      signOut,
    }),
    [
      user,
      loading,
      isGuest,
      guestPromptsRemaining,
      signInWithGoogle,
      signInWithFake,
      signInAsGuest,
      signInWithPassword,
      signUp,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
