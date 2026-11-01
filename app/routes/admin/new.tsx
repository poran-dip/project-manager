import { data, Link, redirect, useNavigation } from "react-router";
import { createProject, getTechNames } from "~/.server/projects";
import { ProjectForm } from "~/components/project-form";
import { EMPTY_PROJECT_FORM, parseProjectForm } from "~/lib/project-form";
import type { Route } from "./+types/new";

export function meta() {
  return [{ title: "New project · Admin" }];
}

export async function loader() {
  return { techSuggestions: await getTechNames() };
}

export async function action({ request }: Route.ActionArgs) {
  const result = parseProjectForm(await request.formData());

  if (!result.ok) {
    return data(
      { errors: result.errors, values: result.values },
      { status: 400 },
    );
  }

  const id = await createProject(result.data);

  return redirect(`/admin/${id}`);
}

export default function NewProject({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const busy = useNavigation().state === "submitting";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">New project</h1>
        <Link to="/admin" className="text-sm text-fg-muted hover:text-fg">
          Back to projects
        </Link>
      </div>

      <ProjectForm
        defaults={actionData?.values ?? EMPTY_PROJECT_FORM}
        errors={actionData?.errors}
        techSuggestions={loaderData.techSuggestions}
        submitLabel="Create project"
        busy={busy}
      />
    </main>
  );
}
