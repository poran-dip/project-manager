import type { projects } from "~/.server/db/schema";
import type { Category } from "./taxonomy";

/** A row of the `projects` table, without categories or tech. */
export type ProjectRow = typeof projects.$inferSelect;

/** Fields accepted when inserting a project row. */
export type NewProjectRow = typeof projects.$inferInsert;

/** A project with its categories and tech stack. */
export type Project = ProjectRow & {
  categories: Category[];
  /** Tech display names, e.g. `["React", "SQLite"]`. */
  tech: string[];
};

/** What the public view may see. Private fields are left out. */
export type PublicProject = Omit<Project, "notes" | "ambition">;
