import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useShift } from "../../../contexts/ShiftContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { listTrips, rowPayloadToShift } from "../../cloud/repositories/tripsRepository";
import { qk } from "../../../lib/queryKeys";
import { requireSupabase } from "../../../lib/supabase";
import type { Shift } from "../../../types";

function mergeShifts(local: Shift[], cloud: Shift[]): Shift[] {
  const map = new Map<string, Shift>();
  for (const s of cloud) {
    map.set(s.id, s);
  }
  for (const s of local) {
    if (!map.has(s.id)) {
      map.set(s.id, s);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime(),
  );
}

export function useMergedShiftHistory(): {
  merged: Shift[];
  isLoading: boolean;
} {
  const { history } = useShift();
  const { session, isConfigured } = useAuth();
  const userId = session?.user.id;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: userId ? qk.trips(userId) : ["cloud:trips", "off"],
    enabled: Boolean(userId && isConfigured),
    queryFn: async () => {
      const client = requireSupabase();
      return listTrips(client, userId!);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const cloudShifts = useMemo(() => {
    const out: Shift[] = [];
    for (const row of rows) {
      const s = rowPayloadToShift(row);
      if (s) out.push(s);
    }
    return out;
  }, [rows]);

  const merged = useMemo(
    () => mergeShifts(history, cloudShifts),
    [history, cloudShifts],
  );

  return {
    merged,
    isLoading: Boolean(userId && isConfigured && isLoading),
  };
}
