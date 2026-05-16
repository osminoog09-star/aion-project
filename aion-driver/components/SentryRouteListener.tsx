import { usePathname } from "expo-router";
import { useEffect } from "react";
import { refreshSentryAppContext } from "../lib/sentry";

export function SentryRouteListener() {
  const pathname = usePathname();
  useEffect(() => {
    void refreshSentryAppContext(pathname);
  }, [pathname]);
  return null;
}
