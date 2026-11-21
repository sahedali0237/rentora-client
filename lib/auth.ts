import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };
const client =
  globalForMongo._mongoClient ??
  new MongoClient(process.env.MONGODB_URI as string, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
globalForMongo._mongoClient = client;
const db = client.db("Rentora-site");

// Reused by API routes that update user documents directly (role switching).
export { db };

const baseURL = process.env.BETTER_AUTH_URL;
const isProduction = process.env.NODE_ENV === "production";
const isHttpsBaseURL = baseURL?.startsWith("https://");

export const auth = betterAuth({
    baseURL,
    database: mongodbAdapter(db, {
        client,
    }),
    emailAndPassword: {
        enabled: true,
    },
    advanced: {
        useSecureCookies: isProduction || isHttpsBaseURL,
        defaultCookieAttributes: {
            httpOnly: true,
            secure: isProduction || isHttpsBaseURL,
            sameSite: "lax",
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        }
    },
    user: {
        additionalFields: {
            roles: {
                type: "string[]",
                required: true,
                defaultValue: ["renter"],
                input: false,
            },
            activeRole: {
                type: "string",
                required: true,
                defaultValue: "renter",
                input: true,
            },
        },
    },
});