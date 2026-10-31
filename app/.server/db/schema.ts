// Imports use relative paths, not `~/`, because drizzle-kit loads this file
// outside Vite and doesn't resolve tsconfig path aliases.

import { randomUUID } from "node:crypto";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { GITHUB_STATUSES } from "../../types/github-status";
import { CATEGORIES, STAGES } from "../../types/taxonomy";

/** One row per tracked project. */
export const projects = sqliteTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    /** URL-safe identifier for public pages, e.g. `/p/project-manager`. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    /** Public. One plain-text sentence for cards and meta descriptions. */
    tagline: text("tagline"),
    /** Public. Markdown case study for the project page. */
    writeup: text("writeup").notNull().default(""),
    /** Private. Markdown notes, never sent to the public view. */
    notes: text("notes").notNull().default(""),

    stage: text("stage", { enum: STAGES }).notNull().default("idea"),
    githubStatus: text("github_status", { enum: GITHUB_STATUSES })
      .notNull()
      .default("none"),
    /** Whether the project appears on the public view at all. */
    isPublic: integer("is_public", { mode: "boolean" })
      .notNull()
      .default(false),
    /** Highlighted on the public view. Only takes effect when public. */
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),

    githubUrl: text("github_url"),
    liveUrl: text("live_url"),

    /** Private. 0 to 10. */
    ambition: integer("ambition"),
    /** Fractional index key for drag-and-drop ordering. Sort ascending. */
    order: text("order").notNull(),

    /** Calendar date, `YYYY-MM-DD`. Stored as text to avoid timezone shifts. */
    startDate: text("start_date"),
    /** Calendar date, `YYYY-MM-DD`. Set by hand. */
    lastWorkedOn: text("last_worked_on"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    /** When this record last changed. Set automatically on every update. */
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("projects_order_idx").on(t.order),
    index("projects_public_idx").on(t.isPublic, t.isFeatured),
  ],
);

/** Categories per project. A project can have several. */
export const projectCategories = sqliteTable(
  "project_categories",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    category: text("category", { enum: CATEGORIES }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.category] }),
    index("project_categories_category_idx").on(t.category),
  ],
);

/** Technologies, shared across projects. */
export const tech = sqliteTable("tech", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  /** Display name, e.g. `React`. */
  name: text("name").notNull(),
  /** Normalized name (lowercase, trimmed), so `React` and `react` match. */
  key: text("key").notNull().unique(),
});

/** Technologies per project. */
export const projectTech = sqliteTable(
  "project_tech",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    techId: text("tech_id")
      .notNull()
      .references(() => tech.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.techId] }),
    index("project_tech_tech_idx").on(t.techId),
  ],
);
