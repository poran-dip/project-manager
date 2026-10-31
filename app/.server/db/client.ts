import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Use file:local.db for local development.",
  );
}

const client = createClient({
  url,
  // Not needed for local file databases.
  authToken: process.env.AUTH_TOKEN,
});

/** Drizzle client. Import only from server code. */
export const db = drizzle(client, { schema });
