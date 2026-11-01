// Public view filters, read from the URL: `?stage=a&category=b&tech=react`.
// Any of the selected values within a filter, all filters together.

import {
  CATEGORIES,
  type Category,
  STAGES,
  type Stage,
} from "~/types/taxonomy";

export type ProjectFilters = {
  stages: Stage[];
  categories: Category[];
  /** Lowercased tech names. */
  tech: string[];
};

type Filterable = { stage: Stage; categories: Category[]; tech: string[] };

/** Reads filters from search params, dropping unknown values. */
export function readFilters(params: URLSearchParams): ProjectFilters {
  const stages = params.getAll("stage");
  const categories = params.getAll("category");

  return {
    stages: STAGES.filter((s) => stages.includes(s)),
    categories: CATEGORIES.filter((c) => categories.includes(c)),
    tech: [
      ...new Set(
        params
          .getAll("tech")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    ],
  };
}

export function hasFilters(f: ProjectFilters): boolean {
  return f.stages.length + f.categories.length + f.tech.length > 0;
}

export function filterProjects<T extends Filterable>(
  projects: T[],
  f: ProjectFilters,
): T[] {
  return projects.filter(
    (p) =>
      (f.stages.length === 0 || f.stages.includes(p.stage)) &&
      (f.categories.length === 0 ||
        p.categories.some((c) => f.categories.includes(c))) &&
      (f.tech.length === 0 ||
        p.tech.some((t) => f.tech.includes(t.toLowerCase()))),
  );
}

/** Filter options: only values some project actually has, in UI order. */
export function getFacets(projects: Filterable[]) {
  const stages = new Set(projects.map((p) => p.stage));
  const categories = new Set(projects.flatMap((p) => p.categories));
  const tech = new Map<string, string>();
  for (const name of projects.flatMap((p) => p.tech)) {
    if (!tech.has(name.toLowerCase())) tech.set(name.toLowerCase(), name);
  }

  return {
    stages: STAGES.filter((s) => stages.has(s)),
    categories: CATEGORIES.filter((c) => categories.has(c)),
    tech: [...tech.values()].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    ),
  };
}
