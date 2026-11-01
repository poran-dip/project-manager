// Categories and tech live in join tables. These helpers attach them to rows
// on read and replace them on write.

import { asc, eq, inArray } from "drizzle-orm";
import { CATEGORIES, type Category } from "~/types/taxonomy";
import { db } from "../db/client";
import { projectCategories, projectTech, tech } from "../db/schema";
import type { Executor, Relations } from "./types";

/** Adds `categories` and `tech` to each row, in two queries total. */
export async function withRelations<T extends { id: string }>(
  rows: T[],
): Promise<(T & Relations)[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  const [categoryRows, techRows] = await Promise.all([
    db
      .select()
      .from(projectCategories)
      .where(inArray(projectCategories.projectId, ids)),
    db
      .select({ projectId: projectTech.projectId, name: tech.name })
      .from(projectTech)
      .innerJoin(tech, eq(projectTech.techId, tech.id))
      .where(inArray(projectTech.projectId, ids))
      .orderBy(asc(tech.name)),
  ]);

  const categoriesById = new Map<string, Category[]>();
  for (const { projectId, category } of categoryRows) {
    const list = categoriesById.get(projectId) ?? [];
    list.push(category);
    categoriesById.set(projectId, list);
  }

  const techById = new Map<string, string[]>();
  for (const { projectId, name } of techRows) {
    const list = techById.get(projectId) ?? [];
    list.push(name);
    techById.set(projectId, list);
  }

  return rows.map((row) => ({
    ...row,
    // Same order as CATEGORIES, so the UI groups them consistently.
    categories: (categoriesById.get(row.id) ?? []).sort(
      (a, b) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b),
    ),
    tech: techById.get(row.id) ?? [],
  }));
}

/** Replaces a project's categories and/or tech. Omitted lists are kept. */
export async function setRelations(
  ex: Executor,
  projectId: string,
  { categories, tech: techNames }: Partial<Relations>,
) {
  if (categories) {
    await ex
      .delete(projectCategories)
      .where(eq(projectCategories.projectId, projectId));

    const unique = [...new Set(categories)];
    if (unique.length > 0) {
      await ex
        .insert(projectCategories)
        .values(unique.map((category) => ({ projectId, category })));
    }
  }

  if (techNames) {
    await ex.delete(projectTech).where(eq(projectTech.projectId, projectId));

    // Keyed by normalized name; the first spelling seen is kept for display.
    const byKey = new Map<string, string>();
    for (const raw of techNames) {
      const name = raw.trim();
      const key = name.toLowerCase();
      if (key && !byKey.has(key)) byKey.set(key, name);
    }

    if (byKey.size > 0) {
      await ex
        .insert(tech)
        .values([...byKey].map(([key, name]) => ({ key, name })))
        .onConflictDoNothing({ target: tech.key });

      const techRows = await ex
        .select({ id: tech.id })
        .from(tech)
        .where(inArray(tech.key, [...byKey.keys()]));

      await ex
        .insert(projectTech)
        .values(techRows.map(({ id }) => ({ projectId, techId: id })));
    }
  }
}
