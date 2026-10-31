/**
 * Project lifecycle stages, in lifecycle order. Source of truth for the
 * Drizzle enum and UI ordering.
 */
export const STAGES = [
  "idea",
  "has-potential",
  "working-on",
  "completed",
  "maintained",
  "scrapped",
] as const;

/** A project's lifecycle stage. */
export type Stage = (typeof STAGES)[number];

/** UI label and definition for each stage. */
export const STAGE_INFO = {
  idea: {
    label: "Idea",
    description: "New, near-empty repo or folder",
  },
  "has-potential": {
    label: "Has potential",
    description: "Vetted idea or stalled project, will work on someday",
  },
  "working-on": {
    label: "Working on",
    description: "Actively working on it",
  },
  completed: {
    label: "Completed",
    description: "Finished, won't be touched again",
  },
  maintained: {
    label: "Maintained",
    description: "Finished, still occasionally maintained",
  },
  scrapped: {
    label: "Scrapped",
    description: "Decided against the idea",
  },
} satisfies Record<Stage, { label: string; description: string }>;

/** Groups that categories are shown under in the UI. */
export const CATEGORY_GROUPS = ["platform", "kind"] as const;

/** A category group: what a project runs on, or what kind of project it is. */
export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

/** UI heading for each category group. */
export const CATEGORY_GROUP_INFO = {
  platform: { label: "Runs on" },
  kind: { label: "Kind" },
} satisfies Record<CategoryGroup, { label: string }>;

/**
 * Project categories; a project can have several. Source of truth for the
 * Drizzle enum and UI ordering.
 */
export const CATEGORIES = [
  // platform
  "web",
  "mobile",
  "desktop",
  "extension",
  "api",
  "cli",
  "sbc",
  // kind
  "tool",
  "library",
  "template",
  "game",
  "simulation",
  "experiment",
  "research",
  "ai-ml",
] as const;

/** A project category. */
export type Category = (typeof CATEGORIES)[number];

/** UI group, label and definition for each category. */
export const CATEGORY_INFO = {
  web: {
    group: "platform",
    label: "Web",
    description: "Runs in the browser",
  },
  mobile: {
    group: "platform",
    label: "Mobile",
    description: "Mobile apps",
  },
  desktop: {
    group: "platform",
    label: "Desktop",
    description: "Desktop apps",
  },
  extension: {
    group: "platform",
    label: "Extension",
    description: "Browser extensions",
  },
  api: {
    group: "platform",
    label: "API",
    description: "Backend services and APIs",
  },
  cli: {
    group: "platform",
    label: "CLI",
    description: "Runs in the terminal",
  },
  sbc: {
    group: "platform",
    label: "SBC",
    description: "Single-board computers like the Raspberry Pi",
  },
  tool: {
    group: "kind",
    label: "Tool",
    description: "Personal tooling",
  },
  library: {
    group: "kind",
    label: "Library",
    description: "Published packages",
  },
  template: {
    group: "kind",
    label: "Template",
    description: "Starters for other projects",
  },
  game: {
    group: "kind",
    label: "Game",
    description: "Games and interactive experiences",
  },
  simulation: {
    group: "kind",
    label: "Simulation",
    description: "Simulations and visualizations of systems",
  },
  experiment: {
    group: "kind",
    label: "Experiment",
    description: "Trying new tech, contests, curiosity",
  },
  research: {
    group: "kind",
    label: "Research",
    description: "Research and investigation",
  },
  "ai-ml": {
    group: "kind",
    label: "AI / ML",
    description: "AI and machine learning",
  },
} satisfies Record<
  Category,
  { group: CategoryGroup; label: string; description: string }
>;
