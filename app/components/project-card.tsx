import { Link } from "react-router";
import {
  CATEGORY_INFO,
  type Category,
  STAGE_INFO,
  type Stage,
} from "~/types/taxonomy";
import { Badge, cx } from "./ui";

export type ProjectCardData = {
  slug: string;
  name: string;
  tagline: string | null;
  stage: Stage;
  categories: Category[];
  tech: string[];
};

export function ProjectCard({
  project,
  featured = false,
}: {
  project: ProjectCardData;
  featured?: boolean;
}) {
  return (
    <article
      className={cx(
        "relative flex flex-col gap-3 rounded border bg-surface p-4 hover:bg-raised",
        featured ? "border-line-strong" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">
          {/* The link covers the whole card. */}
          <Link
            to={`/p/${project.slug}`}
            className="after:absolute after:inset-0 hover:text-accent"
          >
            {project.name}
          </Link>
        </h3>
        <Badge tone={featured ? "accent" : "muted"}>
          {STAGE_INFO[project.stage].label}
        </Badge>
      </div>

      {project.tagline && (
        <p className="text-sm text-fg-muted">{project.tagline}</p>
      )}

      {(project.categories.length > 0 || project.tech.length > 0) && (
        <p className="mt-auto text-xs text-fg-subtle">
          {[
            ...project.categories.map((c) => CATEGORY_INFO[c].label),
            ...project.tech,
          ].join(" · ")}
        </p>
      )}
    </article>
  );
}
