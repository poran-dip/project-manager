import { describe, expect, it } from "vitest";
import type { Category, Stage } from "~/types/taxonomy";
import { filterProjects, getFacets, hasFilters, readFilters } from "./filters";

function project(
  name: string,
  stage: Stage,
  categories: Category[],
  tech: string[],
) {
  return { name, stage, categories, tech };
}

const projects = [
  project("a", "working-on", ["web", "tool"], ["React", "SQLite"]),
  project("b", "completed", ["cli"], ["Rust"]),
  project("c", "working-on", ["game"], ["react"]),
];

function names(query: string) {
  return filterProjects(projects, readFilters(new URLSearchParams(query))).map(
    (p) => p.name,
  );
}

describe("readFilters", () => {
  it("drops unknown values and normalizes tech", () => {
    const filters = readFilters(
      new URLSearchParams(
        "stage=nope&stage=idea&category=x&tech=%20React&tech=react",
      ),
    );

    expect(filters).toEqual({
      stages: ["idea"],
      categories: [],
      tech: ["react"],
    });
  });

  it("reports whether any filter is set", () => {
    expect(hasFilters(readFilters(new URLSearchParams("")))).toBe(false);
    expect(hasFilters(readFilters(new URLSearchParams("tech=go")))).toBe(true);
  });
});

describe("filterProjects", () => {
  it("returns everything with no filters", () => {
    expect(names("")).toEqual(["a", "b", "c"]);
  });

  it("matches any value within a filter", () => {
    expect(names("stage=completed&stage=working-on")).toEqual(["a", "b", "c"]);
    expect(names("category=cli&category=game")).toEqual(["b", "c"]);
  });

  it("requires every filter to match", () => {
    expect(names("stage=working-on&category=web")).toEqual(["a"]);
  });

  it("matches tech case-insensitively", () => {
    expect(names("tech=REACT")).toEqual(["a", "c"]);
  });
});

describe("getFacets", () => {
  it("lists only values in use, in UI order, with tech deduped", () => {
    expect(getFacets(projects)).toEqual({
      stages: ["working-on", "completed"],
      categories: ["web", "cli", "tool", "game"],
      tech: ["React", "Rust", "SQLite"],
    });
  });
});
