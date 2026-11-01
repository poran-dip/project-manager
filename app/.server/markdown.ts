// Markdown to HTML for public write-ups. Raw HTML in the source is escaped,
// not rendered, and markdown-it's default link check drops `javascript:`
// and similar URLs.

import MarkdownIt, { type RendererRule } from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const renderLinkOpen: RendererRule =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

// External links don't pass on referrer or window access.
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = String(tokens[idx].attrGet("href") ?? "");
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet("rel", "noopener noreferrer");
  }
  return renderLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}
