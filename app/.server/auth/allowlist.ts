// GitHub accounts allowed to sign in, by numeric user ID. IDs never change,
// unlike usernames, which can be renamed and then claimed by someone else.

/**
 * Parses ADMIN_GITHUB_IDS, a comma-separated list of numeric GitHub user IDs.
 * Read on every call so a change takes effect without a restart in dev.
 */
export function getAllowedGithubIds(): Set<string> {
  const raw = process.env.ADMIN_GITHUB_IDS ?? "";

  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)),
  );
}

/**
 * Whether a GitHub user ID is on the allowlist. Accepts a number or string,
 * since GitHub's API returns a number and Better Auth stores a string. An
 * empty or missing allowlist allows no one.
 */
export function isAllowedGithubId(id: unknown): boolean {
  if (typeof id !== "string" && typeof id !== "number") return false;

  return getAllowedGithubIds().has(String(id));
}
