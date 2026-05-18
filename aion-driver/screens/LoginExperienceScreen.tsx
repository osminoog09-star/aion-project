import { router, useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GradientButton } from "../components/ui/GradientButton";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useAuthScreenMessage } from "../features/auth/hooks/useAuthDeepLinkParams";
import { isValidEmail } from "../features/cloud/validation/authFields";
import { getOAuthRedirectUri } from "../features/auth/services/supabaseOAuth";
import { supabase } from "../lib/supabase";
import { radius } from "../tokens";

function CloudStatusBanner({
  configured,
  semantic,
}: {
  configured: boolean;
  semantic: ReturnType<typeof useTheme>["semantic"];
}) {
  if (configured) {
    return (
      <Animated.View entering={FadeInDown.duration(380)} className="mb-6">
        <View
          className="rounded-2xl border px-4 py-3"
          style={{ borderColor: semantic.border, backgroundColor: semantic.accentMuted }}
        >
          <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: semantic.accent }}>
            Облако готово
          </Text>
          <Text className="mt-1 text-sm leading-5" style={{ color: semantic.textSecondary }}>
            Профиль, валюта, смены и заправки сохраняются на сервере — после переустановки APK
            восстановятся при входе в тот же аккаунт.
          </Text>
        </View>
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeInDown.duration(380)} className="mb-6">
      <View
        className="rounded-2xl border px-4 py-3"
        style={{ borderColor: semantic.borderStrong, backgroundColor: semantic.surfaceMuted }}
      >
        <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
          Облако недоступно
        </Text>
        <Text className="mt-1 text-sm leading-5" style={{ color: semantic.textSecondary }}>
          Сейчас вход в аккаунт недоступен. Продолжайте в гостевом режиме — данные останутся на устройстве.
        </Text>
      </View>
    </Animated.View>
  );
}

export function LoginExperienceScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fromOnboarding?: string }>();
  const fromOnboarding = params.fromOnboarding === "1";
  const { semantic, resolved } = useTheme();
  const {
    isConfigured,
    signInWithEmail,
    signUpWithEmail,
    resendConfirmationEmail,
    resetPasswordForEmail,
    signOut,
    signInWithGoogle,
    signInWithApple,
    user,
    enterGuestMode,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const { banner, setBanner, clearBanner } = useAuthScreenMessage();
  const [msg, setMsg] = useState<string | null>(null);
  const [msgIsInfo, setMsgIsInfo] = useState(false);
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const showMsg = (text: string, isInfo: boolean) => {
    setMsg(text);
    setMsgIsInfo(isInfo);
    clearBanner();
  };

  const onSubmit = async () => {
    setMsg(null);
    setMsgIsInfo(false);
    clearBanner();
    if (!isConfigured) {
      setMsg(
        "Сервер авторизации недоступен. Обновите Driver (OTA) или напишите в поддержку.",
      );
      return;
    }
    if (!isValidEmail(email)) {
      setMsg("Некорректный email");
      return;
    }
    if (password.length < 8) {
      setMsg("Пароль не короче 8 символов");
      return;
    }
    setBusy("email");
    const res =
      mode === "signIn"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
    setBusy(null);
    if (res.error) {
      showMsg(res.error, false);
      return;
    }
    if (res.info) {
      showMsg(res.info, true);
      setAwaitingEmailConfirm(true);
      setMode("signIn");
      return;
    }
    const sess = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!sess) {
      showMsg("Сессия не создана. Подтвердите email или попробуйте снова.", false);
      return;
    }
    router.replace("/home");
  };

  const onResend = async () => {
    if (!isValidEmail(email)) {
      showMsg("Укажите email для повторной отправки", false);
      return;
    }
    setBusy("resend");
    const res = await resendConfirmationEmail(email);
    setBusy(null);
    if (res.error) showMsg(res.error, false);
    else if (res.info) showMsg(res.info, true);
  };

  const onForgotPassword = async () => {
    if (!isValidEmail(email)) {
      showMsg("Укажите email для сброса пароля", false);
      return;
    }
    setBusy("reset");
    const res = await resetPasswordForEmail(email);
    setBusy(null);
    if (res.error) showMsg(res.error, false);
    else if (res.info) showMsg(res.info, true);
  };

  const onGoogle = async () => {
    setMsg(null);
    clearBanner();
    if (!isConfigured) {
      setMsg("Вход Google недоступен без облачной конфигурации.");
      return;
    }
    setBusy("google");
    const res = await signInWithGoogle();
    if (res.error) {
      setBusy(null);
      setMsg(res.error);
      return;
    }
    let sess = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!sess && supabase) {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 250));
        sess = (await supabase.auth.getSession()).data.session;
        if (sess) break;
      }
    }
    setBusy(null);
    if (!sess) {
      setMsg(
        "Вход через Google не завершился. Проверьте redirect URI в Google Cloud и Test users для вашего Gmail.",
      );
      return;
    }
    router.replace("/home");
  };

  const onApple = async () => {
    setMsg(null);
    if (!isConfigured) {
      setMsg("Вход Apple недоступен без облачной конфигурации.");
      return;
    }
    setBusy("apple");
    const res = await signInWithApple();
    setBusy(null);
    if (res.error) setMsg(res.error);
    else router.replace("/home");
  };

  const blurTint = resolved === "light" ? "light" : "dark";

  function renderGlassCard(children: ReactNode) {
    return Platform.OS === "ios" ? (
      <BlurView intensity={28} tint={blurTint} style={{ borderRadius: radius.xxl, overflow: "hidden" }}>
        <LinearGradient
          colors={
            resolved === "light"
              ? (["rgba(255,255,255,0.72)", "rgba(248,250,252,0.55)"] as const)
              : (["rgba(15,23,42,0.55)", "rgba(3,7,18,0.35)"] as const)
          }
          style={{ padding: 20 }}
        >
          {children}
        </LinearGradient>
      </BlurView>
    ) : (
      <View
        style={{
          borderRadius: radius.xxl,
          padding: 20,
          backgroundColor: resolved === "light" ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.88)",
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <CockpitBackground variant="cockpit">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 22,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-xs uppercase tracking-[0.35em]" style={{ color: semantic.accent }}>
            AION · облако
          </Text>
          <Text className="mt-3 text-3xl font-semibold" style={{ color: semantic.textPrimary }}>
            Вход
          </Text>
          <Text className="mt-2 text-sm leading-6" style={{ color: semantic.textSecondary }}>
            {fromOnboarding
              ? "Создайте аккаунт, чтобы данные не пропали при переустановке приложения. Можно пропустить — тогда всё останется только на телефоне."
              : "Войдите или зарегистрируйтесь для облачного бэкапа. Гостевой режим — только на устройстве."}
          </Text>
          {__DEV__ ? (
            <Text className="mt-2 text-[10px]" style={{ color: semantic.textTertiary }} selectable>
              OAuth redirect (dev): {getOAuthRedirectUri()}
            </Text>
          ) : null}

          <CloudStatusBanner configured={isConfigured} semantic={semantic} />

          {user ? (
            <View
              className="overflow-hidden rounded-3xl border"
              style={{ borderColor: semantic.border }}
            >
              {renderGlassCard(
                <>
                  <Text className="text-base font-medium" style={{ color: semantic.textPrimary }}>
                    Вы вошли
                  </Text>
                  <Text className="mt-1 text-sm" style={{ color: semantic.accent }}>
                    {user.email}
                  </Text>
                  <GradientButton
                    title="Выйти"
                    variant="danger"
                    className="mt-4"
                    onPress={async () => {
                      setBusy("out");
                      await signOut();
                      setBusy(null);
                    }}
                    loading={busy === "out"}
                  />
                  <GradientButton title="К кокпиту" className="mt-3" onPress={() => router.replace("/home")} />
                </>,
              )}
            </View>
          ) : (
            <View className="overflow-hidden rounded-3xl border" style={{ borderColor: semantic.border }}>
              {renderGlassCard(
                <>
                  <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: semantic.textTertiary }}>
                    Email
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@driver.app"
                    placeholderTextColor={semantic.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className="mt-2 rounded-2xl border px-4 py-3.5 text-base"
                    style={{
                      borderColor: emailFocused ? semantic.accent : semantic.border,
                      backgroundColor: semantic.surfaceMuted,
                      color: semantic.textPrimary,
                    }}
                  />
                  <Text
                    className="mt-4 text-xs font-bold uppercase tracking-widest"
                    style={{ color: semantic.textTertiary }}
                  >
                    Пароль
                  </Text>
                  <TextInput
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={semantic.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    className="mt-2 rounded-2xl border px-4 py-3.5 text-base"
                    style={{
                      borderColor: passFocused ? semantic.accent : semantic.border,
                      backgroundColor: semantic.surfaceMuted,
                      color: semantic.textPrimary,
                    }}
                  />

                  <View className="mt-5 flex-row gap-2">
                    <Pressable
                      onPress={() => setMode("signIn")}
                      className="flex-1 rounded-xl border py-2.5"
                      style={{
                        borderColor: mode === "signIn" ? semantic.accent : semantic.border,
                        backgroundColor: mode === "signIn" ? semantic.accentMuted : "transparent",
                      }}
                    >
                      <Text className="text-center text-sm font-semibold" style={{ color: semantic.textPrimary }}>
                        Вход
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setMode("signUp")}
                      className="flex-1 rounded-xl border py-2.5"
                      style={{
                        borderColor: mode === "signUp" ? semantic.violet : semantic.border,
                        backgroundColor: mode === "signUp" ? "rgba(124,58,237,0.12)" : "transparent",
                      }}
                    >
                      <Text className="text-center text-sm font-semibold" style={{ color: semantic.textPrimary }}>
                        Регистрация
                      </Text>
                    </Pressable>
                  </View>

                  <GradientButton
                    title={mode === "signIn" ? "Войти по email" : "Создать аккаунт"}
                    className="mt-6"
                    onPress={() => void onSubmit()}
                    loading={busy === "email"}
                    disabled={busy !== null}
                  />

                  {mode === "signIn" ? (
                    <Pressable className="mt-3 py-2" onPress={() => void onForgotPassword()} disabled={busy !== null}>
                      <Text className="text-center text-xs" style={{ color: semantic.textSecondary }}>
                        {busy === "reset" ? "Отправка…" : "Забыли пароль?"}
                      </Text>
                    </Pressable>
                  ) : null}

                  {(mode === "signIn" && awaitingEmailConfirm) || mode === "signUp" ? (
                    <Pressable className="mt-2 py-2" onPress={() => void onResend()} disabled={busy !== null}>
                      <Text className="text-center text-xs" style={{ color: semantic.accent }}>
                        {busy === "resend" ? "Отправка…" : "Отправить письмо подтверждения ещё раз"}
                      </Text>
                    </Pressable>
                  ) : null}

                  <View className="my-6 flex-row items-center gap-3">
                    <View className="h-px flex-1" style={{ backgroundColor: semantic.border }} />
                    <Text className="text-xs uppercase" style={{ color: semantic.textTertiary }}>
                      или
                    </Text>
                    <View className="h-px flex-1" style={{ backgroundColor: semantic.border }} />
                  </View>

                  <GradientButton
                    title="Google"
                    variant="glass"
                    onPress={() => void onGoogle()}
                    loading={busy === "google"}
                    disabled={busy !== null}
                  />

                  {Platform.OS === "ios" ? (
                    <GradientButton
                      title="Apple"
                      variant="ghost"
                      className="mt-3"
                      onPress={() => void onApple()}
                      loading={busy === "apple"}
                      disabled={busy !== null}
                    />
                  ) : null}

                  {fromOnboarding ? (
                    <GradientButton
                      title="Позже — без облака"
                      variant="ghost"
                      className="mt-6"
                      onPress={() => router.replace("/home")}
                      disabled={busy !== null}
                    />
                  ) : null}
                  <Pressable
                    className="mt-4 items-center py-2"
                    onPress={() => {
                      void (async () => {
                        setBusy("guest");
                        await enterGuestMode();
                        setBusy(null);
                        router.replace("/home");
                      })();
                    }}
                    disabled={busy !== null}
                  >
                    <Text className="text-sm" style={{ color: semantic.textSecondary }}>
                      {busy === "guest" ? "Гостевой режим…" : "Продолжить как гость · только локально"}
                    </Text>
                  </Pressable>
                </>,
              )}
            </View>
          )}

          {banner || msg ? (
            <View
              className="mt-5 rounded-2xl border px-4 py-3"
              style={{
                borderColor:
                  banner?.isInfo || msgIsInfo
                    ? "rgba(52,211,153,0.35)"
                    : resolved === "light"
                      ? "rgba(225,29,72,0.28)"
                      : "rgba(251,113,133,0.35)",
                backgroundColor: semantic.surfaceMuted,
              }}
            >
              <Text
                className="text-sm leading-5"
                style={{
                  color: banner?.isInfo || msgIsInfo ? "#6ee7b7" : semantic.danger,
                }}
              >
                {banner?.text ?? msg}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </CockpitBackground>
  );
}
