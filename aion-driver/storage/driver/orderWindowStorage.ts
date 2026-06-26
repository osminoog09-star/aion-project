import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  EMPTY_ORDER_WINDOW_STATE,
  type OrderWindowState,
} from "../../features/intelligence/orderWindowReducer";

/** Окна активности заказа на смену (для классификатора км). Локально на устройстве. */
const keyFor = (shiftId: string) => `aion.driver.orderWindows.v1.${shiftId}`;

export async function loadOrderWindowState(
  shiftId: string,
): Promise<OrderWindowState> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(shiftId));
    if (!raw) return EMPTY_ORDER_WINDOW_STATE;
    const v = JSON.parse(raw) as Partial<OrderWindowState>;
    if (!v || !Array.isArray(v.windows)) return EMPTY_ORDER_WINDOW_STATE;
    return { active: v.active ?? null, windows: v.windows };
  } catch {
    return EMPTY_ORDER_WINDOW_STATE;
  }
}

export async function saveOrderWindowState(
  shiftId: string,
  state: OrderWindowState,
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(shiftId), JSON.stringify(state));
  } catch {
    /* ignore: запись окон не критична для самой смены */
  }
}
