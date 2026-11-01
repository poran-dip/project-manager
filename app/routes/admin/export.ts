// JSON backup of every project, private fields included. Guarded and marked
// no-store by the admin layout's middleware.

import { getProjects } from "~/.server/projects";

/** Bump when the shape changes, so import can tell old backups apart. */
export const EXPORT_VERSION = 1;

export async function loader() {
  const projects = await getProjects();
  const exportedAt = new Date();
  const date = exportedAt.toISOString().slice(0, 10);

  return new Response(
    JSON.stringify({ version: EXPORT_VERSION, exportedAt, projects }, null, 2),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="projects-${date}.json"`,
      },
    },
  );
}
