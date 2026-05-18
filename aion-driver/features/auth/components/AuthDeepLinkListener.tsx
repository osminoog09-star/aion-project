import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { isAuthCallbackUrl } from "../services/authRedirect";
import { establishSessionFromCallbackUrl } from "../services/establishSessionFromCallback";

/**
 * Обрабатывает aion-driver://auth/callback из письма подтверждения / OAuth.
 */
export function AuthDeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    if (!client) return;

    const handleUrl = (url: string) => {
      if (!isAuthCallbackUrl(url)) return;
      void (async () => {
        const res = await establishSessionFromCallbackUrl(client, url);
        if (res.ok) {
          router.replace("/home");
        } else {
          router.replace({
            pathname: "/(auth)/login",
            params: { authError: res.message },
          });
        }
      })();
    };

    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
