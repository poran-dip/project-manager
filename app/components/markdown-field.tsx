// Markdown textarea with a preview toggle. The textarea stays in the form
// while hidden, so the value is always submitted. The renderer is loaded the
// first time the preview opens, keeping it out of the initial bundle.

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cx, describedBy, FieldError, inputClass } from "./ui";

type Render = (source: string) => string;

export function MarkdownField({
  id,
  name,
  label,
  defaultValue,
  rows,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  rows: number;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [render, setRender] = useState<Render | null>(null);

  useEffect(() => {
    if (!preview || render) return;
    let cancelled = false;
    import("~/lib/markdown").then((m) => {
      if (!cancelled) setRender(() => m.renderMarkdown);
    });
    return () => {
      cancelled = true;
    };
  }, [preview, render]);

  const toggleLabel = preview ? "Edit markdown" : "Preview markdown";
  const Icon = preview ? EyeOff : Eye;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-fg-muted">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="rounded p-1 text-fg-subtle hover:bg-raised hover:text-fg"
        >
          <Icon size={16} aria-hidden />
        </button>
      </div>

      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        hidden={preview}
        className={inputClass}
        {...describedBy(id, error)}
      />

      {preview && (
        <div
          className={cx(
            "min-h-24 rounded border border-line bg-surface px-4 py-3",
            !render && "text-sm text-fg-subtle",
          )}
        >
          {!render ? (
            "Loading preview…"
          ) : value.trim() ? (
            <div
              className="writeup"
              // Same renderer as the public page: raw HTML is escaped.
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized at render
              dangerouslySetInnerHTML={{ __html: render(value) }}
            />
          ) : (
            <p className="text-sm text-fg-subtle">Nothing to preview.</p>
          )}
        </div>
      )}

      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}
