// Shared UI primitives on the app.css theme tokens. Kept small on purpose;
// visual polish comes later, the class names live here so it happens once.

import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const BUTTON = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-line-strong text-fg hover:bg-raised",
  danger: "border border-danger text-danger hover:bg-danger hover:text-canvas",
  ghost: "text-fg-muted hover:text-fg hover:bg-raised",
} as const;

export function buttonClass(
  variant: keyof typeof BUTTON = "secondary",
  className?: string,
) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50",
    BUTTON[variant],
    className,
  );
}

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof BUTTON }) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}

export const inputClass =
  "w-full rounded border border-line bg-surface px-3 py-2 text-sm text-fg hover:border-line-strong aria-invalid:border-danger";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-fg-muted">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      <FieldError id={`${htmlFor}-error`} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="text-xs text-danger">
      {error}
    </p>
  );
}

/** aria props tying an input to its Field hint or error. */
export function describedBy(id: string, error?: string, hint?: boolean) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-xs",
        tone === "accent"
          ? "border-accent text-accent"
          : "border-line text-fg-muted",
      )}
    >
      {children}
    </span>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "success" | "danger";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "rounded border px-3 py-2 text-sm",
        tone === "danger"
          ? "border-danger text-danger"
          : "border-success text-success",
      )}
    >
      {children}
    </p>
  );
}
