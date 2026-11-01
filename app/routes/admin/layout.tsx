// Layout for every /admin route. Its middleware guards all child loaders and
// actions, and marks every admin response `private, no-store`.

import { Form, Outlet } from "react-router";
import { adminMiddleware, getAdmin } from "~/.server/auth/admin";
import type { Route } from "./+types/layout";

export const middleware: Route.MiddlewareFunction[] = [adminMiddleware];

export function meta() {
  return [{ name: "robots", content: "noindex" }];
}

export function loader({ context }: Route.LoaderArgs) {
  const admin = getAdmin(context);

  return { name: admin.name, image: admin.image };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-semibold">Admin</span>
        <Form
          method="post"
          action="/logout"
          className="flex items-center gap-3"
        >
          <span className="text-sm">{loaderData.name}</span>
          <button type="submit" className="text-sm underline">
            Sign out
          </button>
        </Form>
      </header>
      <Outlet />
    </div>
  );
}
