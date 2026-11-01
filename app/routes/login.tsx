import { Form, redirect } from "react-router";
import { getAdminStatus, NO_STORE, safeAdminPath } from "~/.server/auth/admin";
import { auth } from "~/.server/auth/auth";
import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Sign in" }, { name: "robots", content: "noindex" }];
}

export function headers() {
  return { "Cache-Control": NO_STORE };
}

const ERRORS: Record<string, string> = {
  not_allowed: "This GitHub account can't sign in here.",
  access_denied: "GitHub sign-in was cancelled.",
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = safeAdminPath(url.searchParams.get("redirectTo"));
  const status = await getAdminStatus(request.headers);

  if (status.kind === "admin") throw redirect(redirectTo);

  const code = url.searchParams.get("error");

  return {
    redirectTo,
    signedInAs: status.kind === "forbidden" ? status.user.name : null,
    error: code ? (ERRORS[code] ?? "Sign-in failed. Try again.") : null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const redirectTo = safeAdminPath(form.get("redirectTo")?.toString());

  const { headers, response } = await auth.api.signInSocial({
    body: {
      provider: "github",
      callbackURL: redirectTo,
      errorCallbackURL: "/login",
    },
    headers: request.headers,
    returnHeaders: true,
  });

  if (!response.url) throw new Error("Better Auth returned no GitHub URL.");

  // Forwards the OAuth state cookie along with the redirect to GitHub.
  return redirect(response.url, { headers });
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { redirectTo, signedInAs, error } = loaderData;

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {signedInAs ? (
        <Form method="post" action="/logout">
          <p className="mb-3 text-sm">Signed in as {signedInAs}.</p>
          <button type="submit" className="rounded border px-3 py-2 text-sm">
            Sign out
          </button>
        </Form>
      ) : (
        <Form method="post">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
          >
            Continue with GitHub
          </button>
        </Form>
      )}
    </main>
  );
}
