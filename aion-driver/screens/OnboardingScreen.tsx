import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { CountrySearchModal } from "../components/onboarding/CountrySearchModal";
import { CockpitBackground } from "../components/ui/CockpitBackground";
import { GlowCard } from "../components/ui/GlowCard";
import { GradientButton } from "../components/ui/GradientButton";
import { SkeletonBlock } from "../components/ui/SkeletonBlock";
import { APP_CURRENCIES } from "../core/constants/currencies";
import { searchVehicleCatalog } from "../data/vehicleCatalog";
import type { VehicleCatalogEntry } from "../core/types/vehicle";
import { buildCountryCatalog } from "../features/geo/countryCatalog";
import { detectCountryFromGps } from "../features/geo/detectCountry";
import {
  loadRecentCountryCodes,
  touchRecentCountryCode,
} from "../features/geo/recentCountriesStorage";
import { useDevice } from "../hooks/useDevice";
import { useShift } from "../hooks/useShift";
import type { UserProfile } from "../types";
import type {
  AppCurrencyCode,
  DistanceUnits,
  DriverAggregatorPreference,
  DriverSchedulePreference,
} from "../types/device";
import {
  currencyForCountry,
  distanceUnitsForCountry,
  inferCountryFromTimezone,
  inferFromDeviceLocale,
} from "../services/localeCurrencyInfer";
import { getFuelPriceBandForCountry } from "../services/fuelIntel";

const STEPS = 6;

function aiBullets(
  country: string,
  currency: AppCurrencyCode,
  v: VehicleCatalogEntry | null,
): string[] {
  const car = v ? `${v.brand} ${v.model} ${v.generation ?? ""}`.trim() : "ваш автомобиль";
  return [
    `Регион ${country}, валюта ${currency}: цены топлива подставляются из локального справочника (позже — онлайн-цены).`,
    `${car}: город ${v?.consumptionUrbanLPer100Km ?? "—"} л / трасса ${v?.consumptionExtraUrbanLPer100Km ?? "—"} л (смешанный ${v?.consumptionMixedLPer100Km ?? "—"}).`,
    "Лучшее окно для дохода чаще 18:00–22:00 и пятница — суббота; фиксируйте район с высоким спросом.",
    "Импорт выплат сокращает ручной ввод: снимайте экран Bolt/Uber после смены.",
  ];
}

function flagEmoji(code: string): string {
  const c = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + c.charCodeAt(0) - 65, A + c.charCodeAt(1) - 65);
}

export function OnboardingScreen() {
  const { saveUserProfile } = useShift();
  const { settings, updateSettings, hydrated } = useDevice();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [country, setCountry] = useState(settings.regionCountryCode);
  const [currency, setCurrency] = useState<AppCurrencyCode>(settings.currencyCode);
  const [distanceUnits, setDistanceUnits] = useState<DistanceUnits>(settings.distanceUnits);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicle, setVehicle] = useState<VehicleCatalogEntry | null>(null);
  const [petrolC, setPetrolC] = useState("8.5");
  const [petrolP, setPetrolP] = useState("62");
  const [gasC, setGasC] = useState("11");
  const [gasP, setGasP] = useState("35");
  const [saving, setSaving] = useState(false);
  const [geoPhase, setGeoPhase] = useState<"hidden" | "ask" | "detecting" | "done">("hidden");
  const [geoHint, setGeoHint] = useState("");
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [recentCodes, setRecentCodes] = useState<string[]>([]);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [schedule, setSchedule] = useState<DriverSchedulePreference>("mixed");
  const [aggregator, setAggregator] = useState<DriverAggregatorPreference>("multi");
  const [monthlyTargetStr, setMonthlyTargetStr] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    setSchedule(settings.driverSchedule ?? "mixed");
    setAggregator(settings.primaryAggregator ?? "multi");
    const t = settings.monthlyNetTarget;
    setMonthlyTargetStr(t && t > 0 ? String(t) : "");
  }, [hydrated, settings.driverSchedule, settings.primaryAggregator, settings.monthlyNetTarget]);

  const localeInf = useMemo(() => inferFromDeviceLocale(), []);
  const catalog = useMemo(
    () => buildCountryCatalog(localeInf.localeTag),
    [localeInf.localeTag],
  );

  const applyCountry = useCallback((code: string) => {
    const c = code.toUpperCase();
    setCountry(c);
    setCurrency(currencyForCountry(c));
    setDistanceUnits(distanceUnitsForCountry(c));
    void touchRecentCountryCode(c).then(setRecentCodes);
  }, []);

  useEffect(() => {
    void loadRecentCountryCodes().then(setRecentCodes);
  }, []);

  useEffect(() => {
    if (step === 2) setGeoPhase((p) => (p === "hidden" ? "ask" : p));
  }, [step]);

  useEffect(() => {
    if (!settings.fuelRegionAuto) return;
    const inferred = inferFromDeviceLocale();
    applyCountry(inferred.countryCode);
  }, [settings.fuelRegionAuto, applyCountry]);

  useEffect(() => {
    if (step !== 5 || !vehicle) return;
    const band = getFuelPriceBandForCountry(country, currency);
    setPetrolC(String(vehicle.consumptionMixedLPer100Km));
    setPetrolP(String(band.petrol));
    setGasC(String(Math.round(vehicle.consumptionMixedLPer100Km * 1.12 * 10) / 10));
    setGasP(String(Math.max(1, Math.round(band.petrol * 0.55 * 10) / 10)));
  }, [step, vehicle, country, currency]);

  const suggestions = useMemo(
    () =>
      searchVehicleCatalog(vehicleQuery, 40).filter(
        (v) => v.fuelPrimary !== "ev" || Boolean(v.fuelSecondary),
      ),
    [vehicleQuery],
  );

  const countryMeta = useMemo(
    () => catalog.find((c) => c.code === country),
    [catalog, country],
  );

  const filteredCurrencies = useMemo(() => {
    const q = currencyQuery.trim().toLowerCase();
    if (!q) return [...APP_CURRENCIES];
    return APP_CURRENCIES.filter((c) => c.toLowerCase().includes(q));
  }, [currencyQuery]);

  const parseNum = (s: string) => parseFloat(s.replace(",", "."));

  const applyLocaleDefaults = () => {
    const i = inferFromDeviceLocale();
    applyCountry(i.countryCode);
    void updateSettings({ fuelRegionAuto: true });
  };

  const runGpsDetect = async () => {
    setGeoPhase("detecting");
    setGeoHint("");
    try {
      const g = await detectCountryFromGps();
      if (g.countryCode) {
        applyCountry(g.countryCode);
        setGeoHint(g.detail ?? "GPS");
        setGeoPhase("done");
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* ignore */
        }
        return;
      }
    } catch {
      /* fall through */
    }
    const loc = inferFromDeviceLocale();
    applyCountry(loc.countryCode);
    const tz = inferCountryFromTimezone();
    setGeoHint(
      tz && tz !== loc.countryCode
        ? `GPS недоступен · ${loc.countryCode} (локаль), подсказка TZ: ${tz}`
        : "GPS недоступен · регион из языка телефона",
    );
    setGeoPhase("done");
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* ignore */
    }
  };

  const skipGpsUseLocale = async () => {
    setGeoPhase("detecting");
    const loc = inferFromDeviceLocale();
    applyCountry(loc.countryCode);
    setGeoHint("Без GPS: регион из языка телефона.");
    setGeoPhase("done");
    try {
      await Haptics.selectionAsync();
    } catch {
      /* ignore */
    }
  };

  const onFinish = async () => {
    const pc = parseNum(petrolC);
    const pp = parseNum(petrolP);
    const gc = parseNum(gasC);
    const gp = parseNum(gasP);
    if (!name.trim() || !vehicle) return;
    if (
      !Number.isFinite(pc) ||
      pc <= 0 ||
      !Number.isFinite(pp) ||
      pp <= 0 ||
      !Number.isFinite(gc) ||
      gc <= 0 ||
      !Number.isFinite(gp) ||
      gp <= 0
    ) {
      return;
    }
    const carModel = `${vehicle.brand} ${vehicle.model} ${vehicle.engine} (${vehicle.year})`;
    const profile: UserProfile = {
      name: name.trim(),
      carModel,
      petrolConsumptionLPer100Km: pc,
      petrolPricePerLiter: pp,
      gasConsumptionLPer100Km: gc,
      gasPricePerLiter: gp,
      countryCode: country,
      currencyCode: currency,
    };
    setSaving(true);
    await updateSettings({
      regionCountryCode: country,
      currencyCode: currency,
      fuelRegionAuto: false,
      distanceUnits,
      driverSchedule: schedule,
      primaryAggregator: aggregator,
      monthlyNetTarget: (() => {
        const raw = parseNum(monthlyTargetStr.replace(/\s/g, ""));
        return Number.isFinite(raw) && raw > 0 ? Math.min(Math.round(raw), 9_999_999) : 0;
      })(),
    });
    await saveUserProfile(profile);
    setSaving(false);
    router.replace({
      pathname: "/(auth)/login",
      params: { fromOnboarding: "1" },
    });
  };

  const validStep1 = name.trim().length >= 2;
  const validFuel =
    parseNum(petrolC) > 0 &&
    parseNum(petrolP) > 0 &&
    parseNum(gasC) > 0 &&
    parseNum(gasP) > 0;
  const canFinish = validStep1 && vehicle && validFuel;

  const bgVariant =
    settings.nightContrast === "nightDrive" ? "nightDrive" : "cockpit";

  return (
    <CockpitBackground variant={bgVariant}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
            <Text className="text-[10px] uppercase tracking-[0.35em] text-cyan-400/80">
              шаг {step}/{STEPS}
            </Text>
            <View className="flex-row gap-1">
              {Array.from({ length: STEPS }, (_, i) => (
                <View
                  key={i}
                  className={`h-1.5 w-5 rounded-full ${
                    i < step ? "bg-cyan-400" : "bg-white/10"
                  }`}
                />
              ))}
            </View>
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View key={step} entering={FadeInRight.duration(320)}>
              {step === 1 ? (
                <GlowCard glow="cyan" className="mt-2">
                  <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Профиль водителя
                  </Text>
                  <Text className="mt-2 text-lg font-semibold text-white">
                    Как вас называть?
                  </Text>
                  <Field
                    label="Имя или позывной"
                    value={name}
                    onChangeText={setName}
                    placeholder="Алекс"
                  />
                  <Text className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                    График в линию
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {(
                      [
                        ["full_time", "Полный день"],
                        ["part_time", "Частично"],
                        ["mixed", "Смешанный"],
                      ] as const
                    ).map(([id, label]) => (
                      <Pressable
                        key={id}
                        onPress={() => {
                          setSchedule(id);
                          void Haptics.selectionAsync();
                        }}
                        className={`rounded-xl border px-3 py-2 ${
                          schedule === id ? "border-cyan-400/60 bg-cyan-500/15" : "border-white/10 bg-white/5"
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Основная платформа
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {(
                      [
                        ["bolt", "Bolt"],
                        ["uber", "Uber"],
                        ["yandex", "Yandex"],
                        ["multi", "Несколько"],
                        ["other", "Другое"],
                      ] as const
                    ).map(([id, label]) => (
                      <Pressable
                        key={id}
                        onPress={() => {
                          setAggregator(id);
                          void Haptics.selectionAsync();
                        }}
                        className={`rounded-xl border px-3 py-2 ${
                          aggregator === id ? "border-violet-400/60 bg-violet-500/15" : "border-white/10 bg-white/5"
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Field
                    label={`Цель чистого в месяц (${currency}), опционально`}
                    value={monthlyTargetStr}
                    onChangeText={setMonthlyTargetStr}
                    placeholder="например 120000"
                    keyboardType="decimal-pad"
                    className="mt-5"
                  />
                </GlowCard>
              ) : null}

              {step === 2 ? (
                <GlowCard glow="violet" className="mt-2">
                  <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Регион Driver OS
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-slate-400">
                    Разрешите GPS для точной страны, или выберите вручную из полного каталога ISO. Валюта и
                    км/ми подставятся автоматически.
                  </Text>

                  {geoPhase === "ask" ? (
                    <View className="mt-4 gap-3">
                      <Text className="text-base font-semibold text-white">
                        Разрешить определить страну автоматически?
                      </Text>
                      <GradientButton title="Да, по GPS" onPress={() => void runGpsDetect()} />
                      <GradientButton
                        title="Нет, без GPS (локаль · часовой пояс)"
                        variant="glass"
                        onPress={() => void skipGpsUseLocale()}
                      />
                      <GradientButton title="Как на телефоне" variant="ghost" onPress={applyLocaleDefaults} />
                    </View>
                  ) : null}

                  {geoPhase === "detecting" ? (
                    <View className="mt-5 gap-3">
                      <SkeletonBlock className="mb-1" height={14} />
                      <SkeletonBlock className="mb-1" height={14} />
                      <SkeletonBlock className="mb-1" height={64} />
                      <Text className="text-center text-xs text-slate-500">Определяем регион…</Text>
                    </View>
                  ) : null}

                  {geoPhase === "done" ? (
                    <Animated.View entering={FadeInDown.duration(420)} className="mt-5">
                      <View className="items-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-5">
                        <Text className="text-5xl">{flagEmoji(country)}</Text>
                        <Text className="mt-2 text-center text-xl font-bold text-white">
                          {countryMeta?.name ?? country}
                        </Text>
                        <Text className="mt-1 text-sm text-cyan-200/90">
                          {country} · {currency} · {distanceUnits === "mi" ? "мили" : "километры"}
                        </Text>
                        {geoHint ? (
                          <Text className="mt-2 text-center text-[11px] text-slate-500">{geoHint}</Text>
                        ) : null}
                      </View>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        <GradientButton
                          title="Каталог стран"
                          className="min-w-[48%] flex-1"
                          onPress={() => setCountryModalOpen(true)}
                        />
                        <GradientButton
                          title="Снова GPS"
                          variant="ghost"
                          className="min-w-[48%] flex-1"
                          onPress={() => {
                            setGeoPhase("ask");
                            setGeoHint("");
                          }}
                        />
                      </View>
                    </Animated.View>
                  ) : null}
                </GlowCard>
              ) : null}

              {step === 3 ? (
                <GlowCard glow="neutral" className="mt-2">
                  <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Валюта
                  </Text>
                  <Text className="mt-2 text-sm text-slate-400">
                    По умолчанию из страны. Можно сменить — полный список ISO 4217.
                  </Text>
                  <TextInput
                    value={currencyQuery}
                    onChangeText={setCurrencyQuery}
                    placeholder="Поиск ISO…"
                    placeholderTextColor="#64748b"
                    className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white"
                  />
                  <View className="mt-4 flex-row flex-wrap gap-2">
                    {filteredCurrencies.slice(0, 64).map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setCurrency(c)}
                        className={`rounded-xl border px-3 py-2 ${
                          currency === c
                            ? "border-violet-400/60 bg-violet-500/15"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <Text className="text-xs font-bold text-white">{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {filteredCurrencies.length > 64 ? (
                    <Text className="mt-2 text-[11px] text-slate-600">
                      Уточните поиск — показаны первые 64 из {filteredCurrencies.length}.
                    </Text>
                  ) : null}
                </GlowCard>
              ) : null}

              {step === 4 ? (
                <GlowCard glow="cyan" className="mt-2 p-0">
                  <View className="p-4 pb-2">
                    <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Машина из каталога
                    </Text>
                    <TextInput
                      value={vehicleQuery}
                      onChangeText={setVehicleQuery}
                      placeholder="Например Volkswagen Golf"
                      placeholderTextColor="#64748b"
                      className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-white"
                    />
                  </View>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => {
                          setVehicle(item);
                          setVehicleQuery(`${item.brand} ${item.model}`);
                        }}
                        className={`border-t border-white/5 px-4 py-3 ${
                          vehicle?.id === item.id ? "bg-cyan-500/10" : ""
                        }`}
                      >
                        <Text className="text-base font-semibold text-white">
                          {item.brand} {item.model}{" "}
                          <Text className="text-slate-500">
                            {item.generation ? `${item.generation} · ` : ""}
                            {item.year}
                          </Text>
                        </Text>
                        <Text className="mt-1 text-xs text-slate-400">
                          {item.engine} · {item.fuelPrimary.toUpperCase()} · смешанный{" "}
                          {item.consumptionMixedLPer100Km} л
                          {item.tankLiters ? ` · бак ${item.tankLiters} л` : ""}
                        </Text>
                      </Pressable>
                    )}
                    ListEmptyComponent={
                      <Text className="px-4 py-6 text-center text-sm text-slate-500">
                        Нет совпадений — уточните запрос.
                      </Text>
                    }
                  />
                </GlowCard>
              ) : null}

              {step === 5 && vehicle ? (
                <GlowCard glow="violet" className="mt-2">
                  <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Топливо (бензин / дизель + газ)
                  </Text>
                  <Text className="mt-2 text-sm text-slate-400">
                    {vehicle.brand} {vehicle.model} — подставлены типичные значения для {country}. Можно
                    откорректировать.
                  </Text>
                  <Field
                    label="Расход основного топлива, л/100км"
                    value={petrolC}
                    onChangeText={setPetrolC}
                    keyboardType="decimal-pad"
                    className="mt-4"
                  />
                  <Field
                    label={`Цена основного топлива за 1 л (${currency})`}
                    value={petrolP}
                    onChangeText={setPetrolP}
                    keyboardType="decimal-pad"
                    className="mt-3"
                  />
                  <Field
                    label="Расход газа (л-экв.), л/100км"
                    value={gasC}
                    onChangeText={setGasC}
                    keyboardType="decimal-pad"
                    className="mt-4"
                  />
                  <Field
                    label={`Цена газа за 1 л-экв. (${currency})`}
                    value={gasP}
                    onChangeText={setGasP}
                    keyboardType="decimal-pad"
                    className="mt-3"
                  />
                </GlowCard>
              ) : null}

              {step === 6 ? (
                <GlowCard glow="cyan" className="mt-2">
                  <Text className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    AI рекомендации
                  </Text>
                  <Text className="mt-2 text-lg font-semibold text-white">
                    Персональный старт
                  </Text>
                  {aiBullets(country, currency, vehicle).map((line, i) => (
                    <View key={i} className="mt-4 flex-row gap-3">
                      <View className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400" />
                      <Text className="flex-1 text-sm leading-6 text-slate-300">
                        {line}
                      </Text>
                    </View>
                  ))}
                </GlowCard>
              ) : null}
            </Animated.View>
          </ScrollView>

          <View
            className="border-t border-white/10 bg-slate-950/90 px-4 py-3"
            style={{ paddingBottom: 18 }}
          >
            <View className="flex-row gap-3">
              {step > 1 ? (
                <GradientButton
                  title="Назад"
                  variant="ghost"
                  className="flex-1"
                  onPress={() => setStep((s) => Math.max(1, s - 1))}
                />
              ) : (
                <View className="flex-1" />
              )}
              {step < STEPS ? (
                <GradientButton
                  title="Далее"
                  className="flex-1"
                  onPress={() => {
                    if (step === 1 && !validStep1) return;
                    if (step === 2 && geoPhase !== "done") return;
                    if (step === 4 && !vehicle) return;
                    setStep((s) => Math.min(STEPS, s + 1));
                  }}
                  disabled={
                    (step === 1 && !validStep1) ||
                    (step === 2 && geoPhase !== "done") ||
                    (step === 4 && !vehicle)
                  }
                />
              ) : (
                <GradientButton
                  title="В кокпит"
                  className="flex-1"
                  loading={saving}
                  disabled={saving || !canFinish}
                  onPress={() => void onFinish()}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CountrySearchModal
        visible={countryModalOpen}
        catalog={catalog}
        recentCodes={recentCodes}
        selectedCode={country}
        onSelect={(code) => applyCountry(code)}
        onClose={() => setCountryModalOpen(false)}
      />
    </CockpitBackground>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  className = "",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
  className?: string;
}) {
  return (
    <View className={className}>
      <Text className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        keyboardType={keyboardType}
        className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-base text-white"
      />
    </View>
  );
}
