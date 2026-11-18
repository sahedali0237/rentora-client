/**
 * Promotes a user to platform admin in MongoDB.
 *
 * Usage:
 *   node scripts/make-admin.ts <email>
 *
 * The MONGODB_URI is read from the environment, or from .env.local / .env
 * in the project root. The script sets roles: ["admin"] and
 * activeRole: "admin" on the matching user document.
 *
 * There is deliberately no public endpoint that creates admins — this
 * script is the only way to grant the admin role.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

/** Minimal .env loader so the script runs without extra dependencies. */
function loadEnvFile(): void {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    const contents = readFileSync(path, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const key = match[1] as string;
      let value = (match[2] as string).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main(): Promise<void> {
  loadEnvFile();

  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error('Usage: node scripts/make-admin.ts <email>  (e.g. "admin@rentora.com")');
    process.exitCode = 1;
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Add it to .env.local or export it in your shell.",
    );
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const users = client.db("Rentora-site").collection("user");
    const result = await users.updateOne(
      { email: { $regex: `^${escapeRegExp(email)}$`, $options: "i" } },
      { $set: { roles: ["admin"], activeRole: "admin" } },
    );

    if (result.matchedCount === 0) {
      console.error(`No user found with email: ${email}`);
      console.error("The user must sign up once before they can be promoted.");
      process.exitCode = 1;
      return;
    }

    console.log(
      `Done. ${email} is now an admin (roles: ["admin"], activeRole: "admin"). They must sign out and back in to see the change.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
