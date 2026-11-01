import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set.");
}

export default defineConfig({
  schema: "./app/.server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    // Empty means unset: drizzle-kit rejects an empty token for file URLs.
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
