/**
 * GitHub repo statuses. Source of truth for the Drizzle enum and UI ordering.
 */
export const GITHUB_STATUSES = [
  "public",
  "public-archived",
  "private",
  "none",
] as const;

/** A project's GitHub repo status. */
export type GitHubStatus = (typeof GITHUB_STATUSES)[number];

/** UI label and definition for each GitHub status. */
export const GITHUB_STATUS_INFO = {
  public: {
    label: "Public",
    description: "Public repo",
  },
  "public-archived": {
    label: "Public, archived",
    description: "Public repo, archived on GitHub",
  },
  private: {
    label: "Private",
    description: "Private repo",
  },
  none: {
    label: "Not on GitHub",
    description: "No repo on GitHub",
  },
} satisfies Record<GitHubStatus, { label: string; description: string }>;
