import { afterAll, beforeEach } from "vitest";
import { db } from "../app/.server/db/client";
import {
  account,
  projectCategories,
  projects,
  projectTech,
  session,
  tech,
  user,
  verification,
} from "../app/.server/db/schema";

// Empties every table before each test, so tests don't depend on each other.
beforeEach(async () => {
  await db.delete(projectTech);
  await db.delete(projectCategories);
  await db.delete(tech);
  await db.delete(projects);

  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
});

// Closes the connection after each file so the database file isn't left open.
afterAll(() => {
  db.$client.close();
});
