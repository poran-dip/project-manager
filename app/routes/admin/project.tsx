// Edit or delete one project. Explicit save only.

import { data, Form, Link, redirect, useNavigation } from "react-router";
import {
  deleteProject,
  getProject,
  getTechNames,
  updateProject,
} from "~/.server/projects";
import { ProjectForm } from "~/components/project-form";
import { Button, Notice } from "~/components/ui";
import { parseProjectForm, projectToFormValues } from "~/lib/project-form";
import type { Route } from "./+types/project";

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.name ?? "Project"} · Admin` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const [project, techSuggestions] = await Promise.all([
    getProject(params.id),
    getTechNames(),
  ]);

  if (!project) throw data("Project not found.", { status: 404 });

  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    isPublic: project.isPublic,
    updatedAt: project.updatedAt,
    values: projectToFormValues(project),
    techSuggestions,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    if (!(await deleteProject(params.id))) {
      throw data("Project not found.", { status: 404 });
    }
    return redirect("/admin");
  }

  if (intent === "save") {
    const result = parseProjectForm(form);

    if (!result.ok) {
      return data(
        { saved: false, errors: result.errors, values: result.values },
        { status: 400 },
      );
    }

    if (!(await updateProject(params.id, result.data))) {
      throw data("Project not found.", { status: 404 });
    }

    return { saved: true, errors: undefined, values: undefined };
  }

  throw data("Unknown intent.", { status: 400 });
}

export default function EditProject({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const deleting =
    submitting && navigation.formData?.get("intent") === "delete";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{loaderData.name}</h1>
        <div className="flex items-center gap-4 text-sm">
          {loaderData.isPublic && (
            <Link
              to={`/p/${loaderData.slug}`}
              className="text-fg-muted hover:text-fg"
            >
              View public page
            </Link>
          )}
          <Link to="/admin" className="text-fg-muted hover:text-fg">
            Back to projects
          </Link>
        </div>
      </div>

      {actionData?.saved && <Notice tone="success">Saved.</Notice>}

      <ProjectForm
        // Remounts after a save so normalized values (e.g. a de-duplicated
        // slug) replace what was typed.
        key={String(loaderData.updatedAt)}
        defaults={actionData?.values ?? loaderData.values}
        errors={actionData?.errors}
        techSuggestions={loaderData.techSuggestions}
        submitLabel="Save"
        busy={submitting && !deleting}
      />

      <Form
        method="post"
        className="flex items-center justify-between gap-3 border-t border-line pt-6"
        onSubmit={(e) => {
          if (!confirm(`Delete ${loaderData.name}? This can't be undone.`)) {
            e.preventDefault();
          }
        }}
      >
        <p className="text-sm text-fg-muted">
          Deleting removes the project and its public page.
        </p>
        <Button
          type="submit"
          name="intent"
          value="delete"
          variant="danger"
          disabled={submitting}
        >
          {deleting ? "Deleting…" : "Delete project"}
        </Button>
      </Form>
    </main>
  );
}
