import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";

/** Единый redirect для email-подтверждения, сброса пароля и OAuth. */
export function getAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: "aion-driver",
    path: "auth/callback",
  });
}

export function isAuthCallbackUrl(url: string): boolean {
  return url.includes("auth/callback");
}

export function authCallbackPathForSupabaseDashboard(): string[] {
  const primary = getAuthRedirectUrl();
  const linking = Linking.createURL("auth/callback");
  return [...new Set([primary, linking, "aion-driver://auth/callback"])];
}
