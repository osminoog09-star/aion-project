import { z } from "zod";

const portalPublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

export type PortalPublicEnv = z.infer<typeof portalPublicEnvSchema>;

export function getPortalPublicEnv(): PortalPublicEnv | null {
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  };
  if (!raw.NEXT_PUBLIC_SUPABASE_URL || !raw.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const parsed = portalPublicEnvSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function isPortalSupabaseConfigured(): boolean {
  return getPortalPublicEnv() !== null;
}
