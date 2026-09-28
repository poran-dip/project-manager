import {
  ArrowLeft,
  Download,
  ExternalLink,
  GripVertical,
  Link,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  exportProjects,
  importProjects,
  loadProjects,
  saveProjects,
} from "~/lib/storage";

import type { GitHubStatus, Project, Status } from "~/types/project";

import { emptyProject, GITHUB_STATUSES, STATUSES } from "~/types/project";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Project Manager" },
    { name: "description", content: "Organize and manage your projects." },
  ];
}

const statusLabel = (s: string) => s.replaceAll("-", " ");

const dateInput = (d: Date) => d.toISOString().slice(0, 10);

export default function Home() {
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  const [selected, setSelected] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [status, setStatus] = useState<Status | "all">("all");

  const [sort, setSort] = useState<"order" | "updated" | "ambition" | "name">(
    "order",
  );

  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const visible = useMemo(() => {
    return projects
      .filter((p) => status === "all" || p.status === status)
      .filter((p) => {
        const q = query.toLowerCase().trim();

        return (
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.techStack.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sort === "updated") {
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        }

        if (sort === "ambition") {
          return b.ambition - a.ambition;
        }

        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return a.order - b.order;
      });
  }, [projects, query, status, sort]);

  const active = projects.find((p) => p.id === selected);

  const update = (id: string, patch: Partial<Project>) => {
    setProjects((ps) =>
      ps.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              lastUpdated: new Date(),
            }
          : p,
      ),
    );
  };

  const create = () => {
    const p = emptyProject(projects.length + 1);

    setProjects((ps) => [...ps, p]);
    setSelected(p.id);
  };

  const remove = (id: string) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));

    setSelected(null);
  };

  const onImport = async (file?: File) => {
    if (!file) return;

    try {
      const imported = await importProjects(file);

      setProjects(imported);
      setSelected(null);
    } catch {
      alert("that file doesn't look like a valid projects export.");
    }
  };

  if (active) {
    return (
      <Editor
        project={active}
        onChange={(patch) => update(active.id, patch)}
        onBack={() => setSelected(null)}
        onDelete={() => remove(active.id)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              project registry
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">projects</h1>

            <p className="mt-2 text-sm text-zinc-500">
              {projects.length} projects · persisted locally
            </p>
          </div>

          <div className="flex gap-2">
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => onImport(e.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              <Upload size={15} />
              import
            </button>

            <button
              type="button"
              onClick={() => exportProjects(projects)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              <Download size={15} />
              export
            </button>

            <button
              type="button"
              onClick={create}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
            >
              <Plus size={15} />
              new
            </button>
          </div>
        </header>

        <section className="mb-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-zinc-500 focus-within:border-zinc-600">
            <Search size={16} />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search projects or tech..."
              className="w-full bg-transparent py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "all")}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none"
          >
            <option value="all">all statuses</option>

            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none"
          >
            <option value="order">order</option>

            <option value="updated">last updated</option>

            <option value="ambition">ambition</option>

            <option value="name">name</option>
          </select>
        </section>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-24 text-center text-sm text-zinc-600">
            no projects found
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => setSelected(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-44 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-left transition hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="text-xs tabular-nums text-zinc-600">
          #{project.order}
        </span>

        <span className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] capitalize text-zinc-400">
          {statusLabel(project.status)}
        </span>
      </div>

      <h2 className="line-clamp-2 text-base font-medium text-zinc-100">
        {project.name || "untitled project"}
      </h2>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.techStack.slice(0, 5).map((t) => (
          <span
            key={t}
            className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1 text-xs text-zinc-600">
        <span>ambition</span>

        <span className="text-zinc-400">
          {"●".repeat(Math.max(0, Math.min(10, project.ambition)))}
        </span>
      </div>
    </button>
  );
}

function Editor({
  project,
  onChange,
  onBack,
  onDelete,
}: {
  project: Project;
  onChange: (patch: Partial<Project>) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [techInput, setTechInput] = useState("");

  const addTech = () => {
    const t = techInput.trim();

    if (!t || project.techStack.includes(t)) {
      return;
    }

    onChange({
      techStack: [...project.techStack, t],
    });

    setTechInput("");
  };

  const editList = (key: "bullets" | "notes", index: number, value: string) => {
    const next = [...project[key]];

    next[index] = value;

    onChange({
      [key]: next,
    });
  };

  const addList = (key: "bullets" | "notes") => {
    onChange({
      [key]: [...project[key], ""],
    });
  };

  const removeList = (key: "bullets" | "notes", index: number) => {
    onChange({
      [key]: project[key].filter((_, i) => i !== index),
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200"
          >
            <ArrowLeft size={16} />
            projects
          </button>

          <div className="flex gap-2">
            {project.urls.github && (
              <a
                href={project.urls.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-800 p-2 text-zinc-500 hover:text-zinc-200"
              >
                <Link size={16} />
              </a>
            )}

            {project.urls.live && (
              <a
                href={project.urls.live}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-800 p-2 text-zinc-500 hover:text-zinc-200"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </header>

        <div className="space-y-8">
          <section>
            <input
              value={project.name}
              onChange={(e) =>
                onChange({
                  name: e.target.value,
                })
              }
              className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-zinc-700"
              placeholder="project name"
            />

            <p className="mt-2 font-mono text-xs text-zinc-700">{project.id}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="status">
              <select
                value={project.status}
                onChange={(e) =>
                  onChange({
                    status: e.target.value as Status,
                  })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="github status">
              <select
                value={project.githubStatus}
                onChange={(e) =>
                  onChange({
                    githubStatus: e.target.value as GitHubStatus,
                  })
                }
              >
                {GITHUB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={`ambition · ${project.ambition}/10`}>
              <input
                type="range"
                min="0"
                max="10"
                value={project.ambition}
                onChange={(e) =>
                  onChange({
                    ambition: Number(e.target.value),
                  })
                }
              />
            </Field>

            <Field label="order">
              <input
                type="number"
                value={project.order}
                onChange={(e) =>
                  onChange({
                    order: Number(e.target.value),
                  })
                }
              />
            </Field>

            <Field label="start date">
              <input
                type="date"
                value={dateInput(project.startDate ?? new Date())}
                onChange={(e) =>
                  onChange({
                    startDate: new Date(e.target.value),
                  })
                }
              />
            </Field>

            <Field label="last updated">
              <input
                type="date"
                value={dateInput(project.lastUpdated ?? new Date())}
                onChange={(e) =>
                  onChange({
                    lastUpdated: new Date(e.target.value),
                  })
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="github url">
              <input
                value={project.urls.github}
                onChange={(e) =>
                  onChange({
                    urls: {
                      ...project.urls,
                      github: e.target.value,
                    },
                  })
                }
                placeholder="https://github.com/..."
              />
            </Field>

            <Field label="live url">
              <input
                value={project.urls.live}
                onChange={(e) =>
                  onChange({
                    urls: {
                      ...project.urls,
                      live: e.target.value,
                    },
                  })
                }
                placeholder="https://..."
              />
            </Field>
          </div>

          <section>
            <SectionTitle>tech stack</SectionTitle>

            <div className="flex flex-wrap gap-2">
              {project.techStack.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300"
                >
                  {t}

                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        techStack: project.techStack.filter((x) => x !== t),
                      })
                    }
                    className="text-zinc-600 hover:text-zinc-200"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}

              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTech()}
                placeholder="add technology + enter"
                className="min-w-44 rounded-md border border-dashed border-zinc-800 bg-transparent px-2.5 py-1.5 text-xs outline-none placeholder:text-zinc-700"
              />
            </div>
          </section>

          <ListEditor
            title="bullets"
            items={project.bullets}
            onAdd={() => addList("bullets")}
            onChange={(i, v) => editList("bullets", i, v)}
            onRemove={(i) => removeList("bullets", i)}
          />

          <ListEditor
            title="notes"
            items={project.notes}
            onAdd={() => addList("notes")}
            onChange={(i, v) => editList("notes", i, v)}
            onRemove={(i) => removeList("notes", i)}
          />

          <div className="border-t border-zinc-900 pt-8">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 text-xs text-red-500/70 hover:text-red-400"
            >
              <Trash2 size={14} />
              delete project
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <p className="block">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </span>

      <div className="[&_input:not([type=range])]:w-full [&_input:not([type=range])]:rounded-lg [&_input:not([type=range])]:border [&_input:not([type=range])]:border-zinc-800 [&_input:not([type=range])]:bg-zinc-900 [&_input:not([type=range])]:px-3 [&_input:not([type=range])]:py-2.5 [&_input:not([type=range])]:text-sm [&_input:not([type=range])]:outline-none [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-zinc-800 [&_select]:bg-zinc-900 [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm [&_select]:outline-none">
        {children}
      </div>
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
      {children}
    </h2>
  );
}

function ListEditor({
  title,
  items,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
  onChange: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>

        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-zinc-600 hover:text-zinc-200"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <GripVertical size={15} className="shrink-0 text-zinc-700" />

            <input
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-zinc-700 hover:text-red-400"
            >
              <X size={15} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-700">
            nothing here yet
          </p>
        )}
      </div>
    </section>
  );
}
