export { AionCoreProvider, useAionCore, type AionCoreContextValue } from "./system/AionCoreContext";
export { AION_MODULES, readinessLabel, type AionModuleDefinition, type AionModuleId } from "./modules/registry";
export { collectAionDiagnosticsSnapshot, type AionAuthSnapshotInput } from "./diagnostics/collectAionDiagnosticsSnapshot";
export { deriveAionEntityState, type AionEntityActivity } from "./entity/deriveAionEntityState";
export { useAionEntityStore } from "./entity/aionEntityStore";
export type { AionEntitySoundEventId } from "./entity/aionEntitySoundEvents";
export { AION_ENTITY_SOUND_EVENTS } from "./entity/aionEntitySoundEvents";
export type {
  AionDiagnosticsSnapshot,
  AionDevOpsStub,
  AionEntityState,
  AionOrbState,
  AionOtaPhase,
} from "./diagnostics/types";
export { deriveRecommendations } from "./ai/deriveRecommendations";
export type { AionMemoryEntry, AionRecommendation } from "./ai/memoryTypes";
export { navigateFromAionRecommendation } from "./ai/recommendationNavigation";
export { deriveAdaptiveUiHints, type AionAdaptiveUiHints } from "./ai/adaptiveUi";
export { AION_PERSONA } from "./personality/persona";
export { getDevOpsStatusStub } from "./telemetry/devopsStatus";
