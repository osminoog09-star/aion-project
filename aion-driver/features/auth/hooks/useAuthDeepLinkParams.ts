import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

export function useAuthScreenMessage() {
  const params = useLocalSearchParams<{ authError?: string; authOk?: string }>();
  const [banner, setBanner] = useState<{ text: string; isInfo: boolean } | null>(null);

  useEffect(() => {
    if (params.authError) {
      setBanner({ text: String(params.authError), isInfo: false });
    } else if (params.authOk) {
      setBanner({ text: String(params.authOk), isInfo: true });
    }
  }, [params.authError, params.authOk]);

  return { banner, setBanner, clearBanner: () => setBanner(null) };
}
