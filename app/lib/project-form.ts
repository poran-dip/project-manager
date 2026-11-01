// The project editor's form contract. Actions parse submissions with it; the
// editor can run the same schema client-side for instant feedback.

import * as z from "zod";
import { GITHUB_STATUSES } from "~/types/github-status";
import type { Project } from "~/types/project";
import { CATEGORIES, STAGES } from "~/types/taxonomy";

/** Raw form values: what the inputs hold, before parsing. */
export type ProjectFormValues = {
  name: string;
  slug: string;
  tagline: string;
  writeup: string;
  notes: string;
  stage: string;
  githubStatus: string;
  isPublic: boolean;
  isFeatured: boolean;
  githubUrl: string;
  liveUrl: string;
  ambition: string;
  startDate: string;
  lastWorkedOn: string;
  categories: string[];
  tech: string[];
};

export type ProjectField = keyof ProjectFormValues;

/** Field name to first error message. */
export type ProjectFormErrors = Partial<Record<ProjectField, string>>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isCalendarDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Trimmed text; empty becomes `null`. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => v || null);

const optionalUrl = z
  .string()
  .trim()
  .max(500, "Keep it under 500 characters.")
  .refine((v) => v === "" || isHttpUrl(v), "Enter a full http(s) URL.")
  .transform((v) => v || null);

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || isCalendarDate(v), "Use a valid YYYY-MM-DD date.")
  .transform((v) => v || null);

const markdown = z.string().max(100_000, "Keep it under 100,000 characters.");

export const projectFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(100, "Keep it under 100 characters."),
    slug: z
      .string()
      .trim()
      .max(100, "Keep it under 100 characters.")
      .refine(
        (v) => v === "" || SLUG.test(v),
        "Use lowercase letters, numbers and single hyphens.",
      )
      .transform((v) => v || undefined),
    tagline: optionalText(160),
    writeup: markdown,
    notes: markdown,
    stage: z.enum(STAGES, "Pick a stage."),
    githubStatus: z.enum(GITHUB_STATUSES, "Pick a GitHub status."),
    isPublic: z.boolean(),
    isFeatured: z.boolean(),
    githubUrl: optionalUrl,
    liveUrl: optionalUrl,
    ambition: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 10),
        "Use a whole number from 0 to 10.",
      )
      .transform((v) => (v === "" ? null : Number(v))),
    startDate: optionalDate,
    lastWorkedOn: optionalDate,
    categories: z
      .array(z.enum(CATEGORIES, "Unknown category."))
      .transform((list) => [...new Set(list)]),
    tech: z
      .array(z.string().trim().max(40, "Keep tech names under 40 characters."))
      .max(50, "That's a lot of tech. Keep it under 50.")
      .transform((list) => {
        // Case-insensitive dedupe; the first spelling wins.
        const byKey = new Map<string, string>();
        for (const name of list) {
          const key = name.toLowerCase();
          if (key && !byKey.has(key)) byKey.set(key, name);
        }
        return [...byKey.values()];
      }),
  })
  .refine((d) => !d.isFeatured || d.isPublic, {
    message: "Only public projects can be featured.",
    path: ["isFeatured"],
  });

/** Parsed, normalized project fields, ready for the data layer. */
export type ProjectFormData = z.output<typeof projectFormSchema>;

/** Reads the editor's inputs from a submission. */
export function readProjectForm(form: FormData): ProjectFormValues {
  const text = (key: ProjectField) => form.get(key)?.toString() ?? "";
  const checked = (key: ProjectField) => {
    const v = form.get(key);
    return v === "on" || v === "true";
  };

  return {
    name: text("name"),
    slug: text("slug"),
    tagline: text("tagline"),
    writeup: text("writeup"),
    notes: text("notes"),
    stage: text("stage"),
    githubStatus: text("githubStatus"),
    isPublic: checked("isPublic"),
    isFeatured: checked("isFeatured"),
    githubUrl: text("githubUrl"),
    liveUrl: text("liveUrl"),
    ambition: text("ambition"),
    startDate: text("startDate"),
    lastWorkedOn: text("lastWorkedOn"),
    categories: form.getAll("categories").map(String),
    // Repeated `tech` fields (chip input) or one comma-separated field.
    tech: form
      .getAll("tech")
      .flatMap((v) => String(v).split(","))
      .map((v) => v.trim())
      .filter(Boolean),
  };
}

export type ProjectFormResult =
  | { ok: true; data: ProjectFormData }
  | { ok: false; errors: ProjectFormErrors; values: ProjectFormValues };

/** Validates raw values. Returns the first error per field on failure. */
export function validateProjectForm(
  values: ProjectFormValues,
): ProjectFormResult {
  const result = projectFormSchema.safeParse(values);

  if (result.success) return { ok: true, data: result.data };

  const errors: ProjectFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ProjectField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }

  return { ok: false, errors, values };
}

/** Reads and validates a submission. */
export function parseProjectForm(form: FormData): ProjectFormResult {
  return validateProjectForm(readProjectForm(form));
}

/** Values for a new project. */
export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  name: "",
  slug: "",
  tagline: "",
  writeup: "",
  notes: "",
  stage: "idea",
  githubStatus: "none",
  isPublic: false,
  isFeatured: false,
  githubUrl: "",
  liveUrl: "",
  ambition: "",
  startDate: "",
  lastWorkedOn: "",
  categories: [],
  tech: [],
};

/** Values for editing an existing project. */
export function projectToFormValues(project: Project): ProjectFormValues {
  return {
    name: project.name,
    slug: project.slug,
    tagline: project.tagline ?? "",
    writeup: project.writeup,
    notes: project.notes,
    stage: project.stage,
    githubStatus: project.githubStatus,
    isPublic: project.isPublic,
    isFeatured: project.isFeatured,
    githubUrl: project.githubUrl ?? "",
    liveUrl: project.liveUrl ?? "",
    ambition: project.ambition === null ? "" : String(project.ambition),
    startDate: project.startDate ?? "",
    lastWorkedOn: project.lastWorkedOn ?? "",
    categories: project.categories,
    tech: project.tech,
  };
}
