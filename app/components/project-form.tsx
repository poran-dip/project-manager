// The project editor. Field names match `readProjectForm`. Explicit save only.
// Plain inputs for now: the category multi-select, tech chip input and
// markdown editors replace these later without changing the field names.

import { useId, useState } from "react";
import { Form } from "react-router";
import type { ProjectFormErrors, ProjectFormValues } from "~/lib/project-form";
import { GITHUB_STATUS_INFO, GITHUB_STATUSES } from "~/types/github-status";
import {
  CATEGORIES,
  CATEGORY_GROUP_INFO,
  CATEGORY_GROUPS,
  CATEGORY_INFO,
  STAGE_INFO,
  STAGES,
} from "~/types/taxonomy";
import { Button, cx, describedBy, Field, FieldError, inputClass } from "./ui";

export function ProjectForm({
  defaults,
  errors = {},
  techSuggestions,
  submitLabel,
  busy,
}: {
  defaults: ProjectFormValues;
  errors?: ProjectFormErrors;
  techSuggestions: string[];
  submitLabel: string;
  busy: boolean;
}) {
  const techListId = useId();
  const [isPublic, setIsPublic] = useState(defaults.isPublic);

  return (
    <Form method="post" className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="intent" value="save" />

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            required
            maxLength={100}
            defaultValue={defaults.name}
            className={inputClass}
            {...describedBy("name", errors.name)}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          hint="Public URL: /p/slug. Leave empty to use the name."
          error={errors.slug}
        >
          <input
            id="slug"
            name="slug"
            maxLength={100}
            defaultValue={defaults.slug}
            className={inputClass}
            {...describedBy("slug", errors.slug, true)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Tagline"
            htmlFor="tagline"
            hint="One sentence. Shown on cards and link previews."
            error={errors.tagline}
          >
            <input
              id="tagline"
              name="tagline"
              maxLength={160}
              defaultValue={defaults.tagline}
              className={inputClass}
              {...describedBy("tagline", errors.tagline, true)}
            />
          </Field>
        </div>

        <Field label="Stage" htmlFor="stage" error={errors.stage}>
          <select
            id="stage"
            name="stage"
            defaultValue={defaults.stage}
            className={inputClass}
            {...describedBy("stage", errors.stage)}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_INFO[s].label}: {STAGE_INFO[s].description}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Ambition (private)"
          htmlFor="ambition"
          hint="0 to 10."
          error={errors.ambition}
        >
          <input
            id="ambition"
            name="ambition"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            step={1}
            defaultValue={defaults.ambition}
            className={inputClass}
            {...describedBy("ambition", errors.ambition, true)}
          />
        </Field>

        <Field label="Started" htmlFor="startDate" error={errors.startDate}>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaults.startDate}
            className={inputClass}
            {...describedBy("startDate", errors.startDate)}
          />
        </Field>

        <Field
          label="Last worked on"
          htmlFor="lastWorkedOn"
          error={errors.lastWorkedOn}
        >
          <input
            id="lastWorkedOn"
            name="lastWorkedOn"
            type="date"
            defaultValue={defaults.lastWorkedOn}
            className={inputClass}
            {...describedBy("lastWorkedOn", errors.lastWorkedOn)}
          />
        </Field>
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm text-fg-muted">Categories</legend>
        {CATEGORY_GROUPS.map((group) => (
          <div key={group} className="flex flex-col gap-2">
            <span className="text-xs text-fg-subtle">
              {CATEGORY_GROUP_INFO[group].label}
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => CATEGORY_INFO[c].group === group).map(
                (c) => (
                  <label
                    key={c}
                    title={CATEGORY_INFO[c].description}
                    className="flex items-center gap-1.5 rounded border border-line px-2 py-1 text-sm has-checked:border-accent has-checked:text-accent"
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={c}
                      defaultChecked={defaults.categories.includes(c)}
                      className="accent-accent"
                    />
                    {CATEGORY_INFO[c].label}
                  </label>
                ),
              )}
            </div>
          </div>
        ))}
        <FieldError id="categories-error" error={errors.categories} />
      </fieldset>

      <Field
        label="Tech"
        htmlFor="tech"
        hint="Comma-separated."
        error={errors.tech}
      >
        <input
          id="tech"
          name="tech"
          list={techListId}
          defaultValue={defaults.tech.join(", ")}
          className={inputClass}
          {...describedBy("tech", errors.tech, true)}
        />
        <datalist id={techListId}>
          {techSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field
          label="GitHub status"
          htmlFor="githubStatus"
          error={errors.githubStatus}
        >
          <select
            id="githubStatus"
            name="githubStatus"
            defaultValue={defaults.githubStatus}
            className={inputClass}
            {...describedBy("githubStatus", errors.githubStatus)}
          >
            {GITHUB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {GITHUB_STATUS_INFO[s].label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="GitHub URL"
          htmlFor="githubUrl"
          hint="Shown publicly only for public repos."
          error={errors.githubUrl}
        >
          <input
            id="githubUrl"
            name="githubUrl"
            type="url"
            defaultValue={defaults.githubUrl}
            className={inputClass}
            {...describedBy("githubUrl", errors.githubUrl, true)}
          />
        </Field>

        <Field label="Live URL" htmlFor="liveUrl" error={errors.liveUrl}>
          <input
            id="liveUrl"
            name="liveUrl"
            type="url"
            defaultValue={defaults.liveUrl}
            className={inputClass}
            {...describedBy("liveUrl", errors.liveUrl)}
          />
        </Field>
      </section>

      <Field
        label="Write-up (public, markdown)"
        htmlFor="writeup"
        error={errors.writeup}
      >
        <textarea
          id="writeup"
          name="writeup"
          rows={14}
          defaultValue={defaults.writeup}
          className={inputClass}
          {...describedBy("writeup", errors.writeup)}
        />
      </Field>

      <Field
        label="Notes (private, markdown)"
        htmlFor="notes"
        error={errors.notes}
      >
        <textarea
          id="notes"
          name="notes"
          rows={8}
          defaultValue={defaults.notes}
          className={inputClass}
          {...describedBy("notes", errors.notes)}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-fg-muted">Visibility</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={defaults.isPublic}
            onChange={(e) => setIsPublic(e.currentTarget.checked)}
            className="accent-accent"
          />
          Public
        </label>
        <label
          className={cx(
            "flex items-center gap-2 text-sm",
            !isPublic && "text-fg-subtle",
          )}
        >
          {/* Unchecked and disabled while private; the server enforces it too. */}
          <input
            key={String(isPublic)}
            type="checkbox"
            name="isFeatured"
            defaultChecked={isPublic && defaults.isFeatured}
            disabled={!isPublic}
            className="accent-accent"
            {...describedBy("isFeatured", errors.isFeatured)}
          />
          Featured
        </label>
        <FieldError id="isFeatured-error" error={errors.isFeatured} />
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </Form>
  );
}
