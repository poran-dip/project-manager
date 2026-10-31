// Public reads: only public projects, only public fields.

import { and, asc, eq, getTableColumns } from "drizzle-orm";
import type { PublicProject } from "~/types/project";
import { db } from "../db/client";
import { projects } from "../db/schema";
import { withRelations } from "./relations";

// Every column except the private ones.
const {
  notes: _notes,
  ambition: _ambition,
  ...publicColumns
} = getTableColumns(projects);

/** All public projects, in display order. */
export async function getPublicProjects(): Promise<PublicProject[]> {
  const rows = await db
    .select(publicColumns)
    .from(projects)
    .where(eq(projects.isPublic, true))
    .orderBy(asc(projects.order));

  return withRelations(rows);
}

/** One public project by slug, or `undefined` if missing or not public. */
export async function getPublicProject(
  slug: string,
): Promise<PublicProject | undefined> {
  const rows = await db
    .select(publicColumns)
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.isPublic, true)))
    .limit(1);

  return (await withRelations(rows))[0];
}
