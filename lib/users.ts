import { ObjectId, type Collection, type Document } from "mongodb";
import { db } from "@/lib/auth";

/**
 * Shape of the Better Auth "user" documents this app touches.
 * The adapter keeps generated string ids as `_id`, but falls back to
 * ObjectId for valid 24-char hex ids, so both are tolerated here.
 */
type UserDocument = Document & {
  _id?: ObjectId | string;
  roles?: string[];
  activeRole?: string;
};

/**
 * The "user" collection is managed by the Better Auth MongoDB adapter
 * (the "user" model, one document per account).
 */
export function usersCollection(): Collection<UserDocument> {
  return db.collection<UserDocument>("user");
}

/**
 * Match a Better Auth user id whether it was stored as a plain string
 * `_id` (the normal case) or as an ObjectId (24-char hex ids).
 */
export function userIdFilter(id: string): ObjectId | string {
  if (id.length === 24 && /^[0-9a-f]{24}$/i.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

/**
 * Resolve the canonical "owner/renter" identifier for a Better Auth user id.
 *
 * Better Auth's session exposes `user.id` (the user document's `id` field),
 * which is NOT always the Mongo `_id`. This collection stores `renterId` /
 * `ownerId` by the user's Mongo `_id` (as a string). To make reads and
 * writes agree, we look the user up by session id and return their `_id`
 * as a string. Falls back to the raw id when the lookup is impossible
 * (e.g. no DB access) so callers still get a best-effort value.
 */
export async function resolveCanonicalUserId(
  sessionId: string,
): Promise<string> {
  const user = await usersCollection().findOne({
    _id: userIdFilter(sessionId),
  });
  return user?._id?.toString() ?? sessionId;
}
