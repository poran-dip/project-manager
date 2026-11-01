import { and, eq, ne } from "drizzle-orm";
import { projects } from "../db/schema";
import type { Executor } from "./types";

/** Lowercase, ASCII-only, words joined by hyphens. */
export function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

/** `base`, or `base-2`, `base-3`, ... if taken by another project. */
export async function uniqueSlug(
  ex: Executor,
  base: string,
  excludeId?: string,
): Promise<string> {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;

    const [taken] = await ex
      .select({ id: projects.id })
      .from(projects)
      .where(
        excludeId
          ? and(eq(projects.slug, candidate), ne(projects.id, excludeId))
          : eq(projects.slug, candidate),
      )
      .limit(1);

    if (!taken) return candidate;
  }
}
