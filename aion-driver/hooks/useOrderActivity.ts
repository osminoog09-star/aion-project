import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_ORDER_WINDOW_STATE,
  beginOrderActivity,
  endOrderActivity,
  type OrderActivityKind,
  type OrderWindowState,
} from "../features/intelligence/orderWindowReducer";
import {
  loadOrderWindowState,
  saveOrderWindowState,
} from "../storage/driver/orderWindowStorage";

/** Ручная отметка активности заказа (подача / везу / высадил) для классификации км. */
export function useOrderActivity(shiftId: string | null) {
  const [state, setState] = useState<OrderWindowState>(EMPTY_ORDER_WINDOW_STATE);

  useEffect(() => {
    let alive = true;
    if (!shiftId) {
      setState(EMPTY_ORDER_WINDOW_STATE);
      return;
    }
    void loadOrderWindowState(shiftId).then((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
    };
  }, [shiftId]);

  const begin = useCallback(
    (kind: OrderActivityKind) => {
      setState((cur) => {
        const next = beginOrderActivity(cur, kind, Date.now());
        if (shiftId) void saveOrderWindowState(shiftId, next);
        return next;
      });
    },
    [shiftId],
  );

  const end = useCallback(() => {
    setState((cur) => {
      const next = endOrderActivity(cur, Date.now());
      if (shiftId) void saveOrderWindowState(shiftId, next);
      return next;
    });
  }, [shiftId]);

  return {
    activeKind: state.active?.kind ?? null,
    windowCount: state.windows.length,
    beginPickup: useCallback(() => begin("pickup"), [begin]),
    beginOnOrder: useCallback(() => begin("on_order"), [begin]),
    endActivity: end,
  };
}
