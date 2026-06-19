import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CockpitBackground } from "../../components/ui/CockpitBackground";
import { GlowCard } from "../../components/ui/GlowCard";
import { GradientButton } from "../../components/ui/GradientButton";
import { ensureCloudDevice } from "../../features/aion-link/cloud/ensureCloudDevice";
import {
  claimPairToken,
  issuePairToken,
  revokePairToken,
  type LinkPairTokenRow,
} from "../../features/aion-link/cloud/linkPairTokens";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { requireSupabase } from "../../lib/supabase";
import { colors } from "../../tokens";
import { LinkPairQrScannerModal } from "../../components/aion-link/LinkPairQrScannerModal";
import { getAionPortalBaseUrl } from "../../lib/aionPortalUrl";

type Mode = "issue" | "claim";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "истёк";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function AionLinkPairScreen() {
  const { session, isGuest } = useAuth();
  const userId = session?.user.id && !isGuest ? session.user.id : null;
  const [mode, setMode] = useState<Mode>("issue");

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "left", "right"]}>
      <CockpitBackground>
        <ScrollView className="flex-1 px-4 pt-2" keyboardShouldPersistTaps="handled">
          <Text className="text-center text-xs uppercase tracking-[0.35em] text-slate-500">
            Подключение
          </Text>
          <Text className="mt-4 text-center text-xl font-semibold text-white">
            Два телефона — один аккаунт
          </Text>

          {!userId ? (
            <GlowCard glow="violet" className="mt-6 mb-4">
              <Text className="text-sm leading-6 text-slate-300">
                Войдите через Google или Email, чтобы связать устройства через облако.
              </Text>
              <View className="mt-4">
                <GradientButton title="Войти" variant="primary" onPress={() => router.push("/(auth)/login")} />
              </View>
            </GlowCard>
          ) : (
            <>
              <View className="mt-6 flex-row gap-2">
                <ModeTab label="Выпустить код" active={mode === "issue"} onPress={() => setMode("issue")} />
                <ModeTab label="Ввести код" active={mode === "claim"} onPress={() => setMode("claim")} />
              </View>

              {mode === "issue" ? (
                <IssuePane userId={userId} />
              ) : (
                <ClaimPane userId={userId} />
              )}
            </>
          )}

          <View className="mt-6 mb-10">
            <GradientButton title="Назад" variant="glass" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </CockpitBackground>
    </SafeAreaView>
  );
}

type ModeTabProps = { label: string; active: boolean; onPress: () => void };

function ModeTab({ label, active, onPress }: ModeTabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: active ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.08)",
        backgroundColor: active ? "rgba(76,29,149,0.35)" : "rgba(15,23,42,0.55)",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: active ? colors.violet400 ?? "#a78bfa" : colors.slate400,
          fontWeight: "800",
          fontSize: 12,
          letterSpacing: 1,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

type IssuePaneProps = { userId: string };

function IssuePane({ userId }: IssuePaneProps) {
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<LinkPairTokenRow | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const channel = requireSupabase()
      .channel(`pair-token-${token.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "link_pair_tokens",
          filter: `id=eq.${token.id}`,
        },
        (msg) => {
          const next = msg.new as LinkPairTokenRow;
          setToken(next);
          if (next.status === "claimed") {
            Alert.alert("Готово", "Второй телефон подключён к аккаунту.");
          }
        },
      )
      .subscribe();
    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [token]);

  const onIssue = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const { deviceId } = await ensureCloudDevice(userId);
      const t = await issuePairToken(userId, deviceId);
      setToken(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка выпуска кода");
    } finally {
      setBusy(false);
    }
  }, [userId]);

  const onCopy = useCallback(async () => {
    if (!token) return;
    await Clipboard.setStringAsync(token.code);
    Alert.alert("Скопировано", "Код в буфере обмена.");
  }, [token]);

  const onRevoke = useCallback(async () => {
    if (!token) return;
    try {
      await revokePairToken(userId, token.id);
      setToken(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отзыва");
    }
  }, [token, userId]);

  if (!token) {
    return (
      <GlowCard glow="violet" className="mt-4">
        <Text className="text-sm leading-6 text-slate-300">
          Сгенерируйте код и QR. На втором телефоне — вкладка «Ввести код»: скан QR или ввод вручную.
        </Text>
        <Text className="mt-3 text-[11px] text-slate-500">
          Срок действия кода — 10 минут. После пары код больше нельзя использовать.
        </Text>
        {error ? (
          <Text className="mt-3 text-xs text-rose-300">{error}</Text>
        ) : null}
        <View className="mt-4">
          <GradientButton
            title={busy ? "…" : "Сгенерировать код"}
            variant="primary"
            onPress={() => void onIssue()}
          />
        </View>
      </GlowCard>
    );
  }

  const expiresMs = Date.parse(token.expires_at) - now;
  const claimed = token.status === "claimed";

  return (
    <GlowCard glow={claimed ? "cyan" : "violet"} className="mt-4">
      <Text className="text-[11px] uppercase tracking-widest text-slate-500">
        {claimed ? "Подключено" : "Ваш код"}
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 38,
          fontWeight: "900",
          letterSpacing: 8,
          color: claimed ? "#34d399" : "#a78bfa",
          textAlign: "center",
        }}
      >
        {token.code}
      </Text>
      {!claimed ? (
        <Image
          source={{
            uri: `${getAionPortalBaseUrl()}/api/operations/pair-qr?code=${encodeURIComponent(token.code)}`,
          }}
          style={{
            width: 200,
            height: 200,
            alignSelf: "center",
            marginTop: 16,
            borderRadius: 12,
            backgroundColor: "#fff",
          }}
          accessibilityLabel="QR-код для связи второго телефона"
        />
      ) : null}
      {!claimed ? (
        <Text className="mt-2 text-center text-xs text-slate-500">
          {expiresMs > 0
            ? `истекает через ${formatCountdown(expiresMs)}`
            : "код истёк — выпустите новый"}
        </Text>
      ) : (
        <Text className="mt-2 text-center text-xs text-emerald-300">
          второй телефон подтвердил вход
        </Text>
      )}
      <View className="mt-4 flex-row gap-2">
        <View style={{ flex: 1 }}>
          <GradientButton title="Копировать" variant="glass" onPress={() => void onCopy()} />
        </View>
        <View style={{ flex: 1 }}>
          <GradientButton
            title={claimed ? "Новый код" : "Отозвать"}
            variant="glass"
            onPress={() => {
              if (claimed) {
                setToken(null);
              } else {
                void onRevoke();
              }
            }}
          />
        </View>
      </View>
    </GlowCard>
  );
}

type ClaimPaneProps = { userId: string };

function ClaimPane({ userId }: ClaimPaneProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const onClaim = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const { deviceId } = await ensureCloudDevice(userId);
      const claimed = await claimPairToken(userId, code.trim().toUpperCase(), deviceId);
      if (!claimed) {
        setError("Код не найден или истёк. Проверьте и попробуйте снова.");
        return;
      }
      setDone(true);
      Alert.alert("Готово", "Этот телефон связан с другим устройством аккаунта.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка ввода кода");
    } finally {
      setBusy(false);
    }
  }, [userId, code]);

  if (done) {
    return (
      <GlowCard glow="cyan" className="mt-4">
        <Text className="text-sm font-semibold text-emerald-200">Связано</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-300">
          Снимки и события теперь синхронизируются между обоими телефонами через ваш аккаунт.
        </Text>
        <View className="mt-4">
          <GradientButton title="Связать ещё один" variant="glass" onPress={() => { setDone(false); setCode(""); }} />
        </View>
      </GlowCard>
    );
  }

  return (
    <GlowCard glow="violet" className="mt-4">
      <Text className="text-sm leading-6 text-slate-300">
        Введите код, который сгенерирован на втором телефоне. Подсказка: 6 символов, заглавные.
      </Text>
      <TextInput
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\s+/g, "").toUpperCase())}
        placeholder="A1B2C3"
        placeholderTextColor="rgba(148,163,184,0.45)"
        maxLength={8}
        style={{
          marginTop: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(167,139,250,0.4)",
          backgroundColor: "rgba(15,23,42,0.65)",
          color: "#ddd6fe",
          fontSize: 24,
          letterSpacing: 6,
          textAlign: "center",
          fontWeight: "800",
        }}
      />
      {error ? <Text className="mt-3 text-xs text-rose-300">{error}</Text> : null}
      <View className="mt-4 gap-2">
        {busy ? (
          <ActivityIndicator color={colors.violet400 ?? "#a78bfa"} />
        ) : (
          <>
            <GradientButton title="Связать" variant="primary" onPress={() => void onClaim()} />
            <GradientButton
              title="Сканировать QR"
              variant="glass"
              onPress={() => setQrOpen(true)}
            />
          </>
        )}
      </View>
      <LinkPairQrScannerModal
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        onCode={(c) => {
          setCode(c);
          setError(null);
        }}
      />
    </GlowCard>
  );
}

