// Rules for what the public view shows.

import type { GitHubStatus } from "~/types/github-status";

/** Whose projects these are. Suffix for per-project page titles. */
export const OWNER_NAME = "Poran Dip";

/** Site name for the home page title and link previews. */
export const SITE_NAME = `Projects · ${OWNER_NAME}`;

/**
 * Cache-Control for public pages: CDN caches for a minute, then serves stale
 * while refreshing, so edits show up within about a minute.
 */
export const PUBLIC_CACHE =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=600";

/** The repo link to show publicly: only for public repos, never private. */
export function publicRepoUrl(project: {
  githubStatus: GitHubStatus;
  githubUrl: string | null;
}): string | null {
  const isPublicRepo =
    project.githubStatus === "public" ||
    project.githubStatus === "public-archived";

  return isPublicRepo ? project.githubUrl : null;
}
