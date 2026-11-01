import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders markdown", () => {
    expect(renderMarkdown("# Title\n\n**bold**")).toBe(
      "<h1>Title</h1>\n<p><strong>bold</strong></p>\n",
    );
  });

  it("escapes raw HTML instead of rendering it", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops javascript: links", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");

    expect(html).not.toContain("href");
  });

  it("marks external links noopener noreferrer", () => {
    expect(renderMarkdown("[x](https://example.com)")).toContain(
      'rel="noopener noreferrer"',
    );
    expect(renderMarkdown("[x](/p/other)")).not.toContain("rel=");
  });
});
