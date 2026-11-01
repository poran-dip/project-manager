// Creates a fresh SQLite file in `.test-db/` with the current schema before
// the test run. Runs once, before any test worker starts, so the workers
// inherit DATABASE_URL.

import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { pushSQLiteSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../app/.server/db/schema";

export default async function setup() {
  const dir = join(import.meta.dirname, "..", ".test-db");

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const url = pathToFileURL(join(dir, "test.db")).href;

  process.env.DATABASE_URL = url;
  process.env.DATABASE_AUTH_TOKEN = "";

  // Placeholder auth config so the Better Auth instance can load.
  process.env.BETTER_AUTH_URL = "http://localhost:5173";
  process.env.BETTER_AUTH_SECRET =
    "test-secret-not-used-outside-tests-0123456789";
  process.env.GITHUB_CLIENT_ID = "test-client-id";
  process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
  process.env.ADMIN_GITHUB_IDS = "";

  const client = createClient({ url });
  const { apply } = await pushSQLiteSchema(schema, drizzle(client));
  await apply();
  client.close();
}
