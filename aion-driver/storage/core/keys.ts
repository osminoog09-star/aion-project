/**
 * Ключи AsyncStorage: совместимость с установленными билдами (значения не менять).
 * Логически: driver = смены/профиль/OCR; core/device = платформа.
 */
const PROFILE_KEY = "@aion_driver/profile_v1";
const ACTIVE_SHIFT_KEY = "@aion_driver/active_shift_v1";
const HISTORY_KEY = "@aion_driver/shift_history_v1";
const DEVICE_SETTINGS_KEY = "@aion_driver/device_settings_v1";
const OCR_IMPORTS_KEY = "@aion_driver/ocr_imports_v1";
const AUTH_GUEST_KEY = "@aion_driver/auth_guest_v1";
const AION_LINK_STATE_KEY = "@aion_driver/aion_link_state_v1";
const WHATS_NEW_SEEN_OTA_UPDATE_ID_KEY = "@aion_driver/whats_new_seen_ota_update_id_v1";
/** Якорь headless-слияния (legacy — очищается при старте/сбросе). */
const SHIFT_BG_MERGE_ANCHOR_KEY = "@aion_driver/shift_bg_merge_anchor_v1";
/** Waterline idempotent headless merge (v1). */
const SHIFT_BG_MERGE_STATE_KEY = "@aion_driver/shift_bg_merge_state_v1";
const SHIFT_LOC_TASK_HEARTBEAT_KEY = "@aion_driver/shift_loc_task_heartbeat_v1";
const OCR_QUEUE_KEY = "@aion_driver/ocr_queue_v1";
const POST_SHIFT_HANDOFF_KEY = "@aion_driver/post_shift_handoff_v1";
const SHIFT_GPS_INDEX_KEY = "@aion_driver/shift_gps_index_v1";
const SHIFT_GPS_PREFIX = "@aion_driver/shift_gps_v1:";
const SHIFT_ANALYTICS_INDEX_KEY = "@aion_driver/shift_analytics_index_v1";
const SHIFT_ANALYTICS_PREFIX = "@aion_driver/shift_analytics_v1:";
const PENDING_HEADLESS_GPS_KEY = "@aion_driver/pending_headless_gps_v1";
const PENDING_FUEL_ENTRIES_KEY = "@aion_driver/pending_fuel_entries_v1";

export const STORAGE_KEYS = {
  PROFILE: PROFILE_KEY,
  ACTIVE_SHIFT: ACTIVE_SHIFT_KEY,
  HISTORY: HISTORY_KEY,
  DEVICE_SETTINGS: DEVICE_SETTINGS_KEY,
  OCR_IMPORTS: OCR_IMPORTS_KEY,
  /** «Продолжить как гость» — без Supabase-сессии */
  AUTH_GUEST: AUTH_GUEST_KEY,
  /** Локальное состояние AION Link: id устройства, имя, задел под список парных */
  AION_LINK_STATE: AION_LINK_STATE_KEY,
  /** Последний OTA updateId, для которого пользователь нажал «понятно» в What’s New */
  WHATS_NEW_SEEN_OTA_UPDATE_ID: WHATS_NEW_SEEN_OTA_UPDATE_ID_KEY,
  /** @deprecated только multiRemove при сбросе */
  SHIFT_BG_MERGE_ANCHOR: SHIFT_BG_MERGE_ANCHOR_KEY,
  SHIFT_BG_MERGE_STATE: SHIFT_BG_MERGE_STATE_KEY,
  SHIFT_LOC_TASK_HEARTBEAT: SHIFT_LOC_TASK_HEARTBEAT_KEY,
  OCR_QUEUE: OCR_QUEUE_KEY,
  POST_SHIFT_HANDOFF: POST_SHIFT_HANDOFF_KEY,
  SHIFT_GPS_INDEX: SHIFT_GPS_INDEX_KEY,
  SHIFT_GPS_PREFIX,
  SHIFT_ANALYTICS_INDEX: SHIFT_ANALYTICS_INDEX_KEY,
  SHIFT_ANALYTICS_PREFIX,
  PENDING_HEADLESS_GPS: PENDING_HEADLESS_GPS_KEY,
  PENDING_FUEL_ENTRIES: PENDING_FUEL_ENTRIES_KEY,
} as const;
