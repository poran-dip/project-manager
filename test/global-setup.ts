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
  process.env.AUTH_TOKEN = "";

  const client = createClient({ url });
  const { apply } = await pushSQLiteSchema(schema, drizzle(client));
  await apply();
  client.close();
}
