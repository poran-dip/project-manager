import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Project Manager")).toBe("project-manager");
  });

  it("strips accents", () => {
    expect(slugify("Café Über")).toBe("cafe-uber");
  });

  it("collapses punctuation and trims hyphens from the ends", () => {
    expect(slugify("  --Hello,   World!!--  ")).toBe("hello-world");
  });

  it("falls back to 'project' when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("project");
    expect(slugify("")).toBe("project");
  });
});
