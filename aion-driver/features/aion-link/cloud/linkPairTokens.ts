import { requireSupabase } from "../../../lib/supabase";

/**
 * Короткоживущий QR-токен для парного связывания двух телефонов одного владельца.
 * Issuer (личный девайс) создаёт `pending` запись; claimer (рабочий девайс) сканирует QR
 * и атомарно переводит в `claimed`. RLS owner-only — сторонние не видят токены.
 */
export type LinkPairTokenRow = {
  id: string;
  user_id: string;
  code: string;
  status: "pending" | "claimed" | "expired" | "revoked";
  device_a_id: string | null;
  claimed_by_device_id: string | null;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generatePairCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function issuePairToken(
  userId: string,
  deviceAId: string | null,
): Promise<LinkPairTokenRow> {
  const client = requireSupabase();
  const code = generatePairCode();
  const { data, error } = await client
    .from("link_pair_tokens")
    .insert({
      user_id: userId,
      code,
      device_a_id: deviceAId,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as LinkPairTokenRow;
}

export async function claimPairToken(
  userId: string,
  code: string,
  deviceBId: string,
): Promise<LinkPairTokenRow | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("link_pair_tokens")
    .update({
      status: "claimed",
      claimed_by_device_id: deviceBId,
      claimed_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("code", code)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as LinkPairTokenRow | null;
}

export async function revokePairToken(userId: string, id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("link_pair_tokens")
    .update({ status: "revoked" })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

export async function listPendingPairTokens(userId: string): Promise<LinkPairTokenRow[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("link_pair_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LinkPairTokenRow[];
}
