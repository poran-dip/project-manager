import { redirect } from "react-router";
import { auth } from "~/.server/auth/auth";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  const { headers } = await auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
  });

  // Carries the cookie-clearing headers.
  return redirect("/login", { headers });
}

export function loader() {
  return redirect("/login");
}
