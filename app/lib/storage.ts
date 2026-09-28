import type { Project } from "./types";

const KEY = "project-cms:v1";

type StoredProject = Omit<Project, "startDate" | "lastUpdated"> & {
  startDate?: string;
  lastUpdated?: string;
};

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredProject[];

    return parsed.map((p) => ({
      ...p,
      startDate: p.startDate ? new Date(p.startDate) : undefined,
      lastUpdated: p.lastUpdated ? new Date(p.lastUpdated) : undefined,
    }));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  const stored: StoredProject[] = projects.map((p) => ({
    ...p,
    startDate: p.startDate?.toISOString(),
    lastUpdated: p.lastUpdated?.toISOString(),
  }));

  localStorage.setItem(KEY, JSON.stringify(stored));
}

export function exportProjects(projects: Project[]) {
  const blob = new Blob(
    [
      JSON.stringify(
        projects.map((p) => ({
          ...p,
          startDate: p.startDate?.toISOString(),
          lastUpdated: p.lastUpdated?.toISOString(),
        })),
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "projects.json";
  a.click();

  URL.revokeObjectURL(url);
}

export async function importProjects(file: File): Promise<Project[]> {
  const raw = JSON.parse(await file.text()) as StoredProject[];

  if (!Array.isArray(raw)) {
    throw new Error("expected an array of projects");
  }

  return raw.map((p) => ({
    ...p,
    startDate: p.startDate ? new Date(p.startDate) : undefined,
    lastUpdated: p.lastUpdated ? new Date(p.lastUpdated) : undefined,
  }));
}
