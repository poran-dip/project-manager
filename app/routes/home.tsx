// Public home: featured projects, then the full grid with filters. Filters are
// a GET form, so they live in the URL and work without JS.

import { Form, Link } from "react-router";
import { getPublicProjects } from "~/.server/projects";
import { ProjectCard, type ProjectCardData } from "~/components/project-card";
import { buttonClass } from "~/components/ui";
import {
  filterProjects,
  getFacets,
  hasFilters,
  type ProjectFilters,
  readFilters,
} from "~/lib/filters";
import { PUBLIC_CACHE, SITE_NAME } from "~/lib/public";
import { CATEGORY_INFO, STAGE_INFO } from "~/types/taxonomy";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: SITE_NAME },
    { property: "og:title", content: SITE_NAME },
    { property: "og:type", content: "website" },
  ];
}

export function headers() {
  return { "Cache-Control": PUBLIC_CACHE };
}

export async function loader({ request }: Route.LoaderArgs) {
  const all = await getPublicProjects();
  const filters = readFilters(new URL(request.url).searchParams);
  const filtering = hasFilters(filters);

  const card = (p: (typeof all)[number]): ProjectCardData => ({
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    stage: p.stage,
    categories: p.categories,
    tech: p.tech,
  });

  return {
    filters,
    filtering,
    facets: getFacets(all),
    // The featured section steps aside while filtering; the grid has it all.
    featured: filtering ? [] : all.filter((p) => p.isFeatured).map(card),
    projects: filterProjects(
      filtering ? all : all.filter((p) => !p.isFeatured),
      filters,
    ).map(card),
    total: all.length,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { filters, filtering, facets, featured, projects, total } = loaderData;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-6">
      <header>
        <h1 className="text-xl font-semibold">{SITE_NAME}</h1>
      </header>

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="flex flex-col gap-4">
          <h2 id="featured" className="text-sm text-fg-muted">
            Featured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} featured />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all" className="flex flex-col gap-4">
        <h2 id="all" className="text-sm text-fg-muted">
          {filtering
            ? `${projects.length} of ${total} projects`
            : featured.length > 0
              ? "More projects"
              : "Projects"}
        </h2>

        {total > 0 && <Filters filters={filters} facets={facets} />}

        {projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        ) : (
          <p className="text-fg-muted">
            {filtering ? "Nothing matches those filters." : "Nothing here yet."}
          </p>
        )}
      </section>
    </main>
  );
}

function Filters({
  filters,
  facets,
}: {
  filters: ProjectFilters;
  facets: ReturnType<typeof getFacets>;
}) {
  const groups = [
    {
      name: "stage",
      legend: "Stage",
      options: facets.stages.map((s) => ({
        value: s,
        label: STAGE_INFO[s].label,
        checked: filters.stages.includes(s),
      })),
    },
    {
      name: "category",
      legend: "Category",
      options: facets.categories.map((c) => ({
        value: c,
        label: CATEGORY_INFO[c].label,
        checked: filters.categories.includes(c),
      })),
    },
    {
      name: "tech",
      legend: "Tech",
      options: facets.tech.map((t) => ({
        value: t,
        label: t,
        checked: filters.tech.includes(t.toLowerCase()),
      })),
    },
  ].filter((g) => g.options.length > 0);

  return (
    <Form
      method="get"
      preventScrollReset
      className="flex flex-col gap-4 rounded border border-line bg-surface p-4"
    >
      {groups.map((g) => (
        <fieldset key={g.name} className="flex flex-wrap items-center gap-2">
          <legend className="mb-2 text-xs text-fg-subtle">{g.legend}</legend>
          {g.options.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-1.5 rounded border border-line px-2 py-1 text-sm has-checked:border-accent has-checked:text-accent"
            >
              <input
                type="checkbox"
                name={g.name}
                value={o.value}
                defaultChecked={o.checked}
                className="accent-accent"
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      ))}

      <div className="flex gap-2">
        <button type="submit" className={buttonClass("primary")}>
          Apply filters
        </button>
        <Link to="/" preventScrollReset className={buttonClass("ghost")}>
          Clear
        </Link>
      </div>
    </Form>
  );
}
