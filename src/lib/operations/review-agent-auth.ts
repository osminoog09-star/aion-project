import { isOwnerAuthenticated } from "@/lib/operations/owner-auth";

/** Cursor autonomous agent or owner may write review queue. */
export async function canWriteArchitectureReviews(req: Request): Promise<boolean> {
  if (await isOwnerAuthenticated()) return true;
  const key = req.headers.get("x-aion-agent-key")?.trim();
  const secret = process.env.OPERATIONS_OWNER_SECRET?.trim();
  if (!secret || secret.length < 16 || !key) return false;
  return key === secret;
}
