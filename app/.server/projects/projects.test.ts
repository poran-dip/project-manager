import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "../db/client";
import { projectCategories, projectTech, tech } from "../db/schema";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  getPublicProject,
  getPublicProjects,
  orderBetween,
  updateProject,
} from ".";

afterEach(() => {
  vi.useRealTimers();
});

describe("public reads", () => {
  it("never include private fields", async () => {
    await createProject({
      name: "Visible",
      isPublic: true,
      notes: "private notes",
      ambition: 9,
    });

    const [listed] = await getPublicProjects();
    const single = await getPublicProject("visible");

    for (const project of [listed, single]) {
      expect(project).toBeDefined();
      expect(project).not.toHaveProperty("notes");
      expect(project).not.toHaveProperty("ambition");
    }
  });

  it("only return public projects", async () => {
    await createProject({ name: "Public", isPublic: true });
    await createProject({ name: "Private" });

    const listed = await getPublicProjects();

    expect(listed.map((p) => p.slug)).toEqual(["public"]);
    expect(await getPublicProject("private")).toBeUndefined();
  });

  it("include categories and tech", async () => {
    await createProject({
      name: "Tagged",
      isPublic: true,
      categories: ["tool", "web"],
      tech: ["React"],
    });

    const project = await getPublicProject("tagged");

    // Categories come back in CATEGORIES order, not insertion order.
    expect(project?.categories).toEqual(["web", "tool"]);
    expect(project?.tech).toEqual(["React"]);
  });
});

describe("createProject", () => {
  it("returns an id that loads the full project", async () => {
    const id = await createProject({
      name: "Full",
      notes: "kept",
      ambition: 4,
    });

    const project = await getProject(id);

    expect(project?.name).toBe("Full");
    expect(project?.notes).toBe("kept");
    expect(project?.ambition).toBe(4);
    expect(project?.stage).toBe("idea");
    expect(project?.githubStatus).toBe("none");
  });

  it("makes slugs unique", async () => {
    await createProject({ name: "Same Name" });
    await createProject({ name: "Same Name" });
    await createProject({ name: "Same Name" });

    const slugs = (await getProjects()).map((p) => p.slug);

    expect(slugs).toEqual(["same-name", "same-name-2", "same-name-3"]);
  });

  it("uses a given slug instead of the name", async () => {
    const id = await createProject({ name: "Long Name", slug: "Short" });

    expect((await getProject(id))?.slug).toBe("short");
  });

  it("adds new projects to the end of the order", async () => {
    await createProject({ name: "First" });
    await createProject({ name: "Second" });
    await createProject({ name: "Third" });

    const names = (await getProjects()).map((p) => p.name);

    expect(names).toEqual(["First", "Second", "Third"]);
  });

  it("collapses duplicate tech and categories", async () => {
    const id = await createProject({
      name: "Dupes",
      categories: ["web", "web"],
      tech: ["React", "react ", " REACT", "SQLite"],
    });

    const project = await getProject(id);

    expect(project?.categories).toEqual(["web"]);
    // The first spelling seen is kept.
    expect(project?.tech).toEqual(["React", "SQLite"]);
  });

  it("shares tech rows between projects", async () => {
    await createProject({ name: "A", tech: ["React"] });
    await createProject({ name: "B", tech: ["react"] });

    expect(await db.select().from(tech)).toHaveLength(1);
  });
});

describe("updateProject", () => {
  it("changes only the given fields", async () => {
    const id = await createProject({ name: "Before", notes: "unchanged" });

    await updateProject(id, { name: "After" });
    const project = await getProject(id);

    expect(project?.name).toBe("After");
    expect(project?.notes).toBe("unchanged");
  });

  it("keeps the slug when the name changes", async () => {
    const id = await createProject({ name: "Original" });

    await updateProject(id, { name: "Renamed" });

    expect((await getProject(id))?.slug).toBe("original");
  });

  it("changes the slug when given one, keeping it unique", async () => {
    await createProject({ name: "Taken" });
    const id = await createProject({ name: "Other" });

    await updateProject(id, { slug: "Taken" });

    expect((await getProject(id))?.slug).toBe("taken-2");
  });

  it("can set a project's slug to its own current slug", async () => {
    const id = await createProject({ name: "Mine" });

    await updateProject(id, { slug: "mine" });

    expect((await getProject(id))?.slug).toBe("mine");
  });

  it("replaces categories and tech when given, keeps them when not", async () => {
    const id = await createProject({
      name: "Lists",
      categories: ["web"],
      tech: ["React"],
    });

    await updateProject(id, { tech: ["Rust"] });
    const project = await getProject(id);

    expect(project?.tech).toEqual(["Rust"]);
    expect(project?.categories).toEqual(["web"]);
  });

  it("moves updatedAt even when only the lists change", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const id = await createProject({ name: "Timed" });

    vi.setSystemTime(new Date("2026-02-01T00:00:00Z"));
    await updateProject(id, { categories: ["game"] });
    const project = await getProject(id);

    expect(project?.createdAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(project?.updatedAt).toEqual(new Date("2026-02-01T00:00:00Z"));
  });

  it("returns false for a missing project", async () => {
    expect(await updateProject("missing", { name: "x" })).toBe(false);
  });
});

describe("deleteProject", () => {
  it("removes the project and its links", async () => {
    const id = await createProject({
      name: "Doomed",
      categories: ["web"],
      tech: ["React"],
    });

    expect(await deleteProject(id)).toBe(true);
    expect(await getProject(id)).toBeUndefined();
    expect(await db.select().from(projectCategories)).toHaveLength(0);
    expect(await db.select().from(projectTech)).toHaveLength(0);
  });

  it("returns false for a missing project", async () => {
    expect(await deleteProject("missing")).toBe(false);
  });
});

describe("ordering", () => {
  it("places a project between two others", async () => {
    await createProject({ name: "A" });
    await createProject({ name: "B" });
    const id = await createProject({ name: "C" });

    const [a, b] = await getProjects();
    await updateProject(id, { order: orderBetween(a.order, b.order) });

    const names = (await getProjects()).map((p) => p.name);

    expect(names).toEqual(["A", "C", "B"]);
  });

  it("places a project at the start", async () => {
    await createProject({ name: "A" });
    const id = await createProject({ name: "B" });

    const [first] = await getProjects();
    await updateProject(id, { order: orderBetween(null, first.order) });

    const names = (await getProjects()).map((p) => p.name);

    expect(names).toEqual(["B", "A"]);
  });
});
