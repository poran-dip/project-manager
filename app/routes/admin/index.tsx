// Project list. Reordering goes through the `move` intent; the up/down buttons
// use it now, and drag and drop will send the same fields.

import { ArrowDown, ArrowUp } from "lucide-react";
import { data, Form, Link, useNavigation } from "react-router";
import { getProjects, moveProject } from "~/.server/projects";
import { Badge, buttonClass, Notice } from "~/components/ui";
import { STAGE_INFO } from "~/types/taxonomy";
import type { Route } from "./+types/index";

export function meta() {
  return [{ title: "Projects · Admin" }];
}

export async function loader() {
  const projects = await getProjects();

  return {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stage: p.stage,
      isPublic: p.isPublic,
      isFeatured: p.isFeatured,
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "move") {
    const id = form.get("id")?.toString() ?? "";
    const neighbour = (key: string) => form.get(key)?.toString() || null;

    const moved = await moveProject(id, {
      prevId: neighbour("prevId"),
      nextId: neighbour("nextId"),
    });

    return moved
      ? { error: null }
      : data(
          { error: "The list changed elsewhere. Reloaded; try again." },
          { status: 409 },
        );
  }

  throw data("Unknown intent.", { status: 400 });
}

export default function AdminIndex({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { projects } = loaderData;
  const busy = useNavigation().state !== "idle";

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Projects</h1>
        <div className="flex gap-2">
          <a href="/admin/export" className={buttonClass("ghost")} download>
            Export JSON
          </a>
          <Link to="/admin/new" className={buttonClass("primary")}>
            New project
          </Link>
        </div>
      </div>

      {actionData?.error && <Notice tone="danger">{actionData.error}</Notice>}

      {projects.length === 0 ? (
        <p className="text-fg-muted">No projects yet.</p>
      ) : (
        <ol className="divide-y divide-line rounded border border-line bg-surface">
          {projects.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <MoveButton
                  label={`Move ${p.name} up`}
                  id={p.id}
                  prevId={projects[i - 2]?.id}
                  nextId={projects[i - 1]?.id}
                  disabled={busy || i === 0}
                  icon="up"
                />
                <MoveButton
                  label={`Move ${p.name} down`}
                  id={p.id}
                  prevId={projects[i + 1]?.id}
                  nextId={projects[i + 2]?.id}
                  disabled={busy || i === projects.length - 1}
                  icon="down"
                />
              </div>

              <Link
                to={`/admin/${p.id}`}
                className="min-w-0 flex-1 truncate hover:text-accent"
              >
                {p.name}
              </Link>

              <div className="flex flex-wrap justify-end gap-1.5">
                <Badge>{STAGE_INFO[p.stage].label}</Badge>
                {p.isPublic && <Badge>Public</Badge>}
                {p.isPublic && p.isFeatured && (
                  <Badge tone="accent">Featured</Badge>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function MoveButton({
  label,
  id,
  prevId,
  nextId,
  disabled,
  icon,
}: {
  label: string;
  id: string;
  prevId: string | undefined;
  nextId: string | undefined;
  disabled: boolean;
  icon: "up" | "down";
}) {
  const Icon = icon === "up" ? ArrowUp : ArrowDown;

  return (
    <Form method="post">
      <input type="hidden" name="intent" value="move" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="prevId" value={prevId ?? ""} />
      <input type="hidden" name="nextId" value={nextId ?? ""} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        disabled={disabled}
        className="rounded p-0.5 text-fg-subtle hover:text-fg disabled:invisible"
      >
        <Icon size={14} aria-hidden />
      </button>
    </Form>
  );
}
