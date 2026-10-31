import type { NewProjectRow } from "~/types/project";
import type { Category } from "~/types/taxonomy";
import type { db } from "../db/client";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The database client or a transaction, for helpers used by both. */
export type Executor = typeof db | Tx;

/** A project's categories and tech, stored in join tables. */
export type Relations = { categories: Category[]; tech: string[] };

/** Fields accepted when creating a project. `slug` defaults to the name. */
export type ProjectInput = Omit<
  NewProjectRow,
  "id" | "slug" | "order" | "createdAt" | "updatedAt"
> &
  Partial<Relations> & { slug?: string };

/**
 * Fields accepted when updating a project. Omitted fields are left as they
 * are; `categories` and `tech`, when given, replace the whole list.
 */
export type ProjectPatch = Partial<
  Omit<NewProjectRow, "id" | "createdAt" | "updatedAt">
> &
  Partial<Relations>;
