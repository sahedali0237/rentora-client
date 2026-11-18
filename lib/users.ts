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
