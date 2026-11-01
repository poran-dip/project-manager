// Better Auth's endpoints: OAuth redirects and callbacks, session, sign-out.

import { auth } from "~/.server/auth/auth";
import type { Route } from "./+types/api.auth";

export function loader({ request }: Route.LoaderArgs) {
  return auth.handler(request);
}

export function action({ request }: Route.ActionArgs) {
  return auth.handler(request);
}
