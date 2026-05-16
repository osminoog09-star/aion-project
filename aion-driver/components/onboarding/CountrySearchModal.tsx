import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { CountryRow } from "../../features/geo/countryCatalog";
import { searchCountries } from "../../features/geo/countryCatalog";

type Props = {
  visible: boolean;
  catalog: CountryRow[];
  recentCodes: readonly string[];
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CountrySearchModal({
  visible,
  catalog,
  recentCodes,
  selectedCode,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const data = useMemo(
    () => searchCountries(catalog, q, recentCodes),
    [catalog, q, recentCodes],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-950 pt-2" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-white/10 px-4 pb-3">
          <Text className="text-lg font-bold text-white">Страна</Text>
          <Pressable onPress={onClose} hitSlop={12} className="rounded-lg bg-white/10 px-3 py-1.5">
            <Text className="text-sm font-semibold text-cyan-300">Готово</Text>
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Поиск по названию или коду…"
          placeholderTextColor="#64748b"
          autoCorrect={false}
          autoCapitalize="none"
          className="mx-4 mt-3 rounded-2xl border border-cyan-500/25 bg-slate-900/90 px-4 py-3 text-base text-white"
        />
        <Text className="mt-2 px-4 text-[10px] uppercase tracking-widest text-slate-500">
          {recentCodes.length ? "Недавние и подсказки сверху · все страны ISO" : "Все страны ISO"}
        </Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={18}
          maxToRenderPerBatch={24}
          windowSize={8}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                try {
                  void Haptics.selectionAsync();
                } catch {
                  /* ignore */
                }
                onSelect(item.code);
                onClose();
              }}
              className={`mb-2 flex-row items-center rounded-2xl border px-3 py-3 ${
                item.code === selectedCode
                  ? "border-cyan-400/50 bg-cyan-500/15"
                  : "border-white/10 bg-slate-900/70"
              }`}
            >
              <Text className="text-2xl">{item.flag}</Text>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-white">{item.name}</Text>
                <Text className="text-xs text-slate-500">{item.code}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
