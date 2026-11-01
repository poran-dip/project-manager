import { describe, expect, it } from "vitest";
import {
  EMPTY_PROJECT_FORM,
  type ProjectFormValues,
  parseProjectForm,
  validateProjectForm,
} from "./project-form";

function values(patch: Partial<ProjectFormValues> = {}): ProjectFormValues {
  return { ...EMPTY_PROJECT_FORM, name: "Project", ...patch };
}

function errorsFor(patch: Partial<ProjectFormValues>) {
  const result = validateProjectForm(values(patch));
  return result.ok ? {} : result.errors;
}

describe("validateProjectForm", () => {
  it("accepts a minimal project and normalizes empty fields", () => {
    const result = validateProjectForm(values({ name: "  Project  " }));

    expect(result).toEqual({
      ok: true,
      data: {
        name: "Project",
        slug: undefined,
        tagline: null,
        writeup: "",
        notes: "",
        stage: "idea",
        githubStatus: "none",
        isPublic: false,
        isFeatured: false,
        githubUrl: null,
        liveUrl: null,
        ambition: null,
        startDate: null,
        lastWorkedOn: null,
        categories: [],
        tech: [],
      },
    });
  });

  it("requires a name", () => {
    expect(errorsFor({ name: "   " }).name).toBeDefined();
  });

  it("only allows featured projects that are public", () => {
    expect(errorsFor({ isFeatured: true }).isFeatured).toMatch(/public/);
    expect(errorsFor({ isFeatured: true, isPublic: true })).toEqual({});
  });

  it("checks slugs, URLs, dates and ambition", () => {
    expect(errorsFor({ slug: "Not A Slug" }).slug).toBeDefined();
    expect(errorsFor({ slug: "a--b" }).slug).toBeDefined();
    expect(errorsFor({ githubUrl: "github.com/x" }).githubUrl).toBeDefined();
    expect(errorsFor({ liveUrl: "javascript:alert(1)" }).liveUrl).toBeDefined();
    expect(errorsFor({ startDate: "2026-02-30" }).startDate).toBeDefined();
    expect(
      errorsFor({ lastWorkedOn: "01/02/2026" }).lastWorkedOn,
    ).toBeDefined();
    expect(errorsFor({ ambition: "11" }).ambition).toBeDefined();
    expect(errorsFor({ ambition: "2.5" }).ambition).toBeDefined();

    expect(
      errorsFor({
        slug: "my-project-2",
        githubUrl: "https://github.com/poran-dip/x",
        startDate: "2024-02-29",
        ambition: "0",
      }),
    ).toEqual({});
  });

  it("rejects unknown enum values", () => {
    const errors = errorsFor({
      stage: "nope",
      githubStatus: "nope",
      categories: ["web", "nope"],
    });

    expect(Object.keys(errors).sort()).toEqual([
      "categories",
      "githubStatus",
      "stage",
    ]);
  });

  it("dedupes categories and tech, keeping the first tech spelling", () => {
    const result = validateProjectForm(
      values({
        categories: ["web", "web"],
        tech: ["React", "react", "SQLite"],
      }),
    );

    expect(result.ok && result.data.categories).toEqual(["web"]);
    expect(result.ok && result.data.tech).toEqual(["React", "SQLite"]);
  });

  it("returns the submitted values with errors, for redisplay", () => {
    const result = validateProjectForm(values({ name: "", tagline: "kept" }));

    expect(result.ok).toBe(false);
    expect(!result.ok && result.values.tagline).toBe("kept");
  });
});

describe("parseProjectForm", () => {
  it("reads checkboxes, repeated fields and comma-separated tech", () => {
    const form = new FormData();
    form.set("name", "Project");
    form.set("stage", "working-on");
    form.set("githubStatus", "public");
    form.set("isPublic", "on");
    form.set("isFeatured", "on");
    form.append("categories", "web");
    form.append("categories", "tool");
    form.append("tech", "React, SQLite");
    form.append("tech", "Vite");

    const result = parseProjectForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      stage: "working-on",
      githubStatus: "public",
      isPublic: true,
      isFeatured: true,
      categories: ["web", "tool"],
      tech: ["React", "SQLite", "Vite"],
    });
  });

  it("treats a missing checkbox as off", () => {
    const form = new FormData();
    form.set("name", "Project");
    form.set("stage", "idea");
    form.set("githubStatus", "none");

    const result = parseProjectForm(form);

    expect(result.ok && result.data.isPublic).toBe(false);
  });
});
