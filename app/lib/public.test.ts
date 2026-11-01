import { describe, expect, it } from "vitest";
import { publicRepoUrl } from "./public";

describe("publicRepoUrl", () => {
  const url = "https://github.com/poran-dip/x";

  it("shows public and archived repos", () => {
    expect(publicRepoUrl({ githubStatus: "public", githubUrl: url })).toBe(url);
    expect(
      publicRepoUrl({ githubStatus: "public-archived", githubUrl: url }),
    ).toBe(url);
  });

  it("hides private repos and projects not on GitHub", () => {
    expect(
      publicRepoUrl({ githubStatus: "private", githubUrl: url }),
    ).toBeNull();
    expect(publicRepoUrl({ githubStatus: "none", githubUrl: url })).toBeNull();
  });

  it("returns null when there's no URL", () => {
    expect(
      publicRepoUrl({ githubStatus: "public", githubUrl: null }),
    ).toBeNull();
  });
});
