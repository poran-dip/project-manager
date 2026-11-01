// Public project page. The write-up is rendered to HTML on the server with
// raw HTML disabled; see ~/lib/markdown.

import { ExternalLink } from "lucide-react";
import { data, Link } from "react-router";
import { getPublicProject } from "~/.server/projects";
import { Badge } from "~/components/ui";
import { renderMarkdown } from "~/lib/markdown";
import {
  OWNER_NAME,
  PUBLIC_CACHE,
  publicRepoUrl,
  SITE_NAME,
} from "~/lib/public";
import { GITHUB_STATUS_INFO } from "~/types/github-status";
import { CATEGORY_INFO, STAGE_INFO } from "~/types/taxonomy";
import type { Route } from "./+types/project";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Not found · ${OWNER_NAME}` }];

  const { name, tagline, url } = loaderData;
  const title = `${name} · ${OWNER_NAME}`;

  return [
    { title },
    ...(tagline ? [{ name: "description", content: tagline }] : []),
    { property: "og:title", content: name },
    ...(tagline ? [{ property: "og:description", content: tagline }] : []),
    { property: "og:type", content: "article" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary" },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

export function headers() {
  return { "Cache-Control": PUBLIC_CACHE };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const project = await getPublicProject(params.slug);

  if (!project) throw data("Project not found.", { status: 404 });

  const url = new URL(`/p/${project.slug}`, request.url).href;

  return {
    name: project.name,
    tagline: project.tagline,
    stage: project.stage,
    categories: project.categories,
    tech: project.tech,
    startDate: project.startDate,
    lastWorkedOn: project.lastWorkedOn,
    liveUrl: project.liveUrl,
    repoUrl: publicRepoUrl(project),
    archived: project.githubStatus === "public-archived",
    html: renderMarkdown(project.writeup),
    url,
  };
}

export default function ProjectPage({ loaderData: p }: Route.ComponentProps) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <Link to="/" className="text-sm text-fg-muted hover:text-fg">
        ← All projects
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <Badge tone="accent">{STAGE_INFO[p.stage].label}</Badge>
        </div>
        {p.tagline && <p className="text-fg-muted">{p.tagline}</p>}

        {(p.liveUrl || p.repoUrl) && (
          <div className="flex flex-wrap gap-4 text-sm">
            {p.liveUrl && (
              <ExternalAnchor href={p.liveUrl}>Live</ExternalAnchor>
            )}
            {p.repoUrl && (
              <ExternalAnchor href={p.repoUrl}>
                {p.archived
                  ? GITHUB_STATUS_INFO["public-archived"].label
                  : "Source"}
              </ExternalAnchor>
            )}
          </div>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {p.categories.length > 0 && (
            <>
              <dt className="text-fg-subtle">Categories</dt>
              <dd>
                {p.categories.map((c) => CATEGORY_INFO[c].label).join(", ")}
              </dd>
            </>
          )}
          {p.tech.length > 0 && (
            <>
              <dt className="text-fg-subtle">Tech</dt>
              <dd>{p.tech.join(", ")}</dd>
            </>
          )}
          {p.startDate && (
            <>
              <dt className="text-fg-subtle">Started</dt>
              <dd>{p.startDate}</dd>
            </>
          )}
          {p.lastWorkedOn && (
            <>
              <dt className="text-fg-subtle">Last worked on</dt>
              <dd>{p.lastWorkedOn}</dd>
            </>
          )}
        </dl>
      </header>

      {p.html && (
        <article
          className="writeup"
          // Server-rendered from markdown with raw HTML disabled.
          // biome-ignore lint: sanitized at render
          dangerouslySetInnerHTML={{ __html: p.html }}
        />
      )}
    </main>
  );
}

function ExternalAnchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-accent hover:underline"
    >
      {children}
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}
