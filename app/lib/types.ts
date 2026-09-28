export type Status =
  | "scrapped"
  | "archived"
  | "ideas"
  | "experiments"
  | "has-potential"
  | "working-on"
  | "complete"
  | "templates"
  | "games";

export type GitHubStatus =
  | "public"
  | "public-archived"
  | "private"
  | "not-on-gh";

export interface Project {
  id: string;
  name?: string;
  startDate?: Date;
  lastUpdated?: Date;

  urls: {
    github?: string;
    live?: string;
  };

  ambition?: number;
  order: number;

  status?: Status;
  githubStatus?: GitHubStatus;

  techStack: string[];
  bullets: string[];
  notes: string[];
}

export const STATUSES: Status[] = [
  "scrapped",
  "archived",
  "ideas",
  "experiments",
  "has-potential",
  "working-on",
  "complete",
  "templates",
  "games",
];

export const GITHUB_STATUSES: GitHubStatus[] = [
  "public",
  "public-archived",
  "private",
  "not-on-gh",
];

export const emptyProject = (order = 1): Project => ({
  id: crypto.randomUUID(),
  order,

  ambition: 5,
  status: "ideas",
  githubStatus: "not-on-gh",

  urls: {},

  techStack: [],
  bullets: [],
  notes: [],
});
