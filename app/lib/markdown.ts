// Markdown to HTML, shared by the public page (server) and the editor preview
// (client), so the preview matches. Raw HTML in the source is escaped, not
// rendered, and markdown-it's default link check drops `javascript:` and
// similar URLs, so the output is safe to inject.

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
