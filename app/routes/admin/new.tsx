// New project. With "Add more" ticked, creating returns to a fresh form here;
// otherwise it goes back to the project list.

import { data, Link, redirect, useLocation, useNavigation } from "react-router";
import { createProject, getProject, getTechNames } from "~/.server/projects";
import { ProjectForm } from "~/components/project-form";
import { Notice } from "~/components/ui";
import { EMPTY_PROJECT_FORM, parseProjectForm } from "~/lib/project-form";
import type { Route } from "./+types/new";

export function meta() {
  return [{ title: "New project · Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const createdId = params.get("created");

  const [techSuggestions, created] = await Promise.all([
    getTechNames(),
    createdId ? getProject(createdId) : undefined,
  ]);

  return {
    techSuggestions,
    addMore: params.get("addMore") === "1",
    created: created ? { id: created.id, name: created.name } : null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const addMore = form.get("addMore") === "on";
  const result = parseProjectForm(form);

  if (!result.ok) {
    return data(
      { errors: result.errors, values: result.values, addMore },
      { status: 400 },
    );
  }

  const id = await createProject(result.data);

  if (addMore) {
    return redirect(
      `/admin/new?${new URLSearchParams({ addMore: "1", created: id })}`,
    );
  }

  return redirect("/admin");
}

export default function NewProject({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const location = useLocation();
  const busy = useNavigation().state === "submitting";
  const { created, techSuggestions } = loaderData;
  const addMore = actionData?.addMore ?? loaderData.addMore;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">New project</h1>
        <Link to="/admin" className="text-sm text-fg-muted hover:text-fg">
          Back to projects
        </Link>
      </div>

      {created && !actionData && (
        <Notice tone="success">
          Created{" "}
          <Link to={`/admin/${created.id}`} className="underline">
            {created.name}
          </Link>
          .
        </Notice>
      )}

      <ProjectForm
        // A new location after each create resets the form to empty.
        key={location.key}
        defaults={actionData?.values ?? EMPTY_PROJECT_FORM}
        errors={actionData?.errors}
        techSuggestions={techSuggestions}
        submitLabel="Create project"
        busy={busy}
        footer={
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              name="addMore"
              defaultChecked={addMore}
              className="accent-accent"
            />
            Add more
          </label>
        }
      />
    </main>
  );
}
