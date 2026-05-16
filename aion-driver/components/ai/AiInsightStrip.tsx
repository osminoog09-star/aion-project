import { Text, View } from "react-native";
import type { AiInsight } from "../../features/ai/services/dashboardAiBlocks";

export function AiInsightStrip({ items }: { items: AiInsight[] }) {
  return (
    <View className="gap-3">
      {items.map((it) => (
        <View
          key={it.id}
          className={`rounded-2xl border px-4 py-3 ${
            it.tone === "amber"
              ? "border-amber-400/25 bg-amber-500/10"
              : it.tone === "violet"
                ? "border-violet-400/25 bg-violet-500/10"
                : "border-cyan-400/25 bg-cyan-500/10"
          }`}
        >
          <Text className="text-[10px] uppercase tracking-widest text-slate-400">
            AI
          </Text>
          <Text className="mt-1 text-base font-semibold text-white">{it.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-300">{it.body}</Text>
        </View>
      ))}
    </View>
  );
}
