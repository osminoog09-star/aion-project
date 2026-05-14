"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { getPortalPublicEnv } from "@/lib/env/portal-env";

export function EcosystemRealtimeBridge() {
  const router = useRouter();
  const attemptRef = useRef(0);

  useEffect(() => {
    const env = getPortalPublicEnv();
    if (!env) return;

    const supabase = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupChannel = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };

    const subscribe = () => {
      if (cancelled) return;
      cleanupChannel();
      const ch = supabase
        .channel(`portal-ecosystem-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ecosystem_public_snapshots",
            filter: "is_public=eq.true",
          },
          () => {
            attemptRef.current = 0;
            void router.refresh();
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            if (cancelled) return;
            const n = ++attemptRef.current;
            const delay = Math.min(30_000, 1000 * 2 ** Math.min(n, 5));
            retryTimer = setTimeout(() => {
              subscribe();
            }, delay);
          }
        });
      channel = ch;
    };

    subscribe();

    return () => {
      cancelled = true;
      cleanupChannel();
    };
  }, [router]);

  return null;
}
