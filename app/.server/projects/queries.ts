// Admin reads: all projects, all fields. Call only behind the auth check.

import { asc, eq } from "drizzle-orm";
import type { Project } from "~/types/project";
import { db } from "../db/client";
import { projects, tech } from "../db/schema";
import { withRelations } from "./relations";

/** All projects, in display order. */
export async function getProjects(): Promise<Project[]> {
  const rows = await db.select().from(projects).orderBy(asc(projects.order));

  return withRelations(rows);
}

/** One project by id, or `undefined` if it doesn't exist. */
export async function getProject(id: string): Promise<Project | undefined> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  return (await withRelations(rows))[0];
}

/** Every tech name, sorted, for autocomplete. Includes unused ones. */
export async function getTechNames(): Promise<string[]> {
  const rows = await db
    .select({ name: tech.name })
    .from(tech)
    .orderBy(asc(tech.key));

  return rows.map((r) => r.name);
}
