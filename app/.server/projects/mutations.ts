// Admin writes. Call only behind the auth check. Inputs are trusted here:
// validate form data in the action first.

import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { projectCategories, projects, projectTech } from "../db/schema";
import { orderBetween } from "./order";
import { setRelations } from "./relations";
import { slugify, uniqueSlug } from "./slug";
import type { ProjectInput, ProjectPatch } from "./types";

/** Creates a project at the end of the order. Returns its id. */
export async function createProject(input: ProjectInput): Promise<string> {
  const { categories, tech: techNames, slug, ...row } = input;

  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ order: projects.order })
      .from(projects)
      .orderBy(desc(projects.order))
      .limit(1);

    const [created] = await tx
      .insert(projects)
      .values({
        ...row,
        slug: await uniqueSlug(tx, slugify(slug ?? row.name)),
        order: orderBetween(last?.order ?? null, null),
      })
      .returning({ id: projects.id });

    await setRelations(tx, created.id, { categories, tech: techNames });

    return created.id;
  });
}

/**
 * Updates a project. Returns `false` if it doesn't exist. The slug changes
 * only when `slug` is given, never when the name changes, so links stay
 * stable.
 */
export async function updateProject(
  id: string,
  patch: ProjectPatch,
): Promise<boolean> {
  const { categories, tech: techNames, slug, ...row } = patch;

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(projects)
      .set({
        ...row,
        ...(slug !== undefined && {
          slug: await uniqueSlug(tx, slugify(slug), id),
        }),
        // Set explicitly so the timestamp moves even when only categories or
        // tech change.
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    if (updated.length === 0) return false;

    await setRelations(tx, id, { categories, tech: techNames });

    return true;
  });
}

/** Deletes a project. Returns `false` if it didn't exist. */
export async function deleteProject(id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    // Deleted explicitly rather than relying on ON DELETE CASCADE, which only
    // runs when SQLite's foreign_keys pragma is on for the connection.
    await tx.delete(projectTech).where(eq(projectTech.projectId, id));
    await tx
      .delete(projectCategories)
      .where(eq(projectCategories.projectId, id));

    const deleted = await tx
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });

    return deleted.length > 0;
  });
}

/**
 * Moves a project between two neighbours, given by id; `null` means the
 * start or end of the list. Returns `false` if any project is missing or the
 * neighbours aren't in order, e.g. a stale list in another tab.
 */
export async function moveProject(
  id: string,
  { prevId, nextId }: { prevId: string | null; nextId: string | null },
): Promise<boolean> {
  if (id === prevId || id === nextId) return false;
  if (prevId !== null && prevId === nextId) return false;

  return db.transaction(async (tx) => {
    const ids = [id, prevId, nextId].filter((v): v is string => v !== null);
    const rows = await tx
      .select({
        id: projects.id,
        order: projects.order,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(inArray(projects.id, ids));
    const orderOf = new Map(rows.map((r) => [r.id, r.order]));
    const moved = rows.find((r) => r.id === id);

    if (!moved || !ids.every((v) => orderOf.has(v))) return false;

    const prev = prevId === null ? null : (orderOf.get(prevId) ?? null);
    const next = nextId === null ? null : (orderOf.get(nextId) ?? null);

    if (prev !== null && next !== null && prev >= next) return false;

    // Reordering isn't an edit, so updatedAt is set back to its own value
    // rather than left to $onUpdateFn.
    await tx
      .update(projects)
      .set({ order: orderBetween(prev, next), updatedAt: moved.updatedAt })
      .where(eq(projects.id, id));

    return true;
  });
}
