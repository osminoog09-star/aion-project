import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "../../../lib/supabase";
import {
  signInWithAppleNative,
  signInWithOAuthRedirect,
} from "../services/supabaseOAuth";
import { translateAuthError } from "../services/authErrorRu";
import { STORAGE_KEYS } from "../../../storage/core/keys";
import * as Linking from "expo-linking";

export type AuthActionResult = {
  error: string | null;
  /** Успех без сессии (например, подтверждение email). */
  info?: string;
};

type AuthStatus = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  isConfigured: boolean;
  /** Гостевой режим: локальные данные без аккаунта */
  isGuest: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
};

const AuthContext = createContext<AuthStatus | undefined>(undefined);

function clearCloudQueryCache(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return typeof k === "string" && k.startsWith("cloud:");
    },
  });
}

async function readGuestFlag(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_GUEST);
    return v === "1";
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (!supabase) {
      void readGuestFlag().then((g) => {
        setIsGuest(g);
        setReady(true);
      });
      return;
    }

    let cancelled = false;

    void (async () => {
      const [{ data }, guestStored] = await Promise.all([
        supabase.auth.getSession(),
        readGuestFlag(),
      ]);
      if (cancelled) return;
      const sess = data.session ?? null;
      setSession(sess);
      setIsGuest(Boolean(guestStored && !sess));
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" && next?.user) {
        void AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
        setIsGuest(false);
      }
      if (event === "SIGNED_OUT") {
        void readGuestFlag().then((g) => setIsGuest(g));
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") {
        void client.auth.startAutoRefresh();
      } else {
        void client.auth.stopAutoRefresh();
      }
    };

    void client.auth.startAutoRefresh();
    const sub = AppState.addEventListener("change", onAppState);
    return () => {
      sub.remove();
      void client.auth.stopAutoRefresh();
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: "Supabase не настроен в .env" };
      }
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !password) {
        return { error: "Email и пароль обязательны" };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (!error) {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
        setIsGuest(false);
      }
      return { error: error ? translateAuthError(error.message) : null };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: "Облако не настроено в этой сборке" };
      }
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || password.length < 8) {
        return { error: "Email и пароль ≥ 8 символов" };
      }
      const emailRedirectTo = Linking.createURL("auth/callback");
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { emailRedirectTo },
      });
      if (error) {
        return { error: translateAuthError(error.message) };
      }
      if (data.session) {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
        setIsGuest(false);
        return { error: null };
      }
      if (data.user) {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
        setIsGuest(false);
        return {
          error: null,
          info: `Аккаунт создан. На ${trimmed} отправлено письмо — откройте ссылку для подтверждения, затем нажмите «Вход» с тем же паролем.`,
        };
      }
      return { error: "Не удалось зарегистрироваться. Попробуйте другой email." };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
    setIsGuest(false);
    clearCloudQueryCache(queryClient);
  }, [queryClient]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: "Supabase не настроен" };
    const res = await signInWithOAuthRedirect(supabase, "google");
    if (res.ok) {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
      setIsGuest(false);
    }
    return res.ok ? { error: null } : { error: res.message };
  }, []);

  const signInWithApple = useCallback(async () => {
    if (!supabase) return { error: "Supabase не настроен" };
    const res = await signInWithAppleNative(supabase);
    if (res.ok) {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
      setIsGuest(false);
    }
    return res.ok ? { error: null } : { error: res.message };
  }, []);

  const enterGuestMode = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_GUEST, "1");
    setIsGuest(true);
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearCloudQueryCache(queryClient);
  }, [queryClient]);

  const exitGuestMode = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_GUEST);
    setIsGuest(false);
  }, []);

  const value = useMemo<AuthStatus>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      isConfigured: isSupabaseConfigured(),
      isGuest,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      signInWithGoogle,
      signInWithApple,
      enterGuestMode,
      exitGuestMode,
    }),
    [
      ready,
      session,
      isGuest,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      signInWithGoogle,
      signInWithApple,
      enterGuestMode,
      exitGuestMode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthStatus {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth должен вызываться внутри AuthProvider");
  }
  return ctx;
}

/** Для мутаций и репозиториев: клиент или null. */
export function useSupabaseClient() {
  const { isConfigured } = useAuth();
  if (!isConfigured) return null;
  if (!supabase) return null;
  return supabase;
}
