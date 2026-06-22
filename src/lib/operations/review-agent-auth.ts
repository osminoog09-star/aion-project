import { isOwnerAuthenticated } from "@/lib/operations/owner-auth";
import { secureSecretMatches } from "@/lib/operations/secure-secret";

/** Cursor autonomous agent or owner may write review queue. */
export async function canWriteArchitectureReviews(req: Request): Promise<boolean> {
  if (await isOwnerAuthenticated()) return true;
  const key = req.headers.get("x-aion-agent-key")?.trim();
  const secret =
    process.env.OPERATIONS_AGENT_KEY?.trim() ||
    process.env.OPERATIONS_OWNER_SECRET?.trim();
  return secureSecretMatches(key, secret);
}
