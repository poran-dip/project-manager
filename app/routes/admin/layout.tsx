// Layout for every /admin route. Its middleware guards all child loaders and
// actions, and marks every admin response `private, no-store`.

import { Form, Link, Outlet } from "react-router";
import { adminMiddleware, getAdmin } from "~/.server/auth/admin";
import { buttonClass } from "~/components/ui";
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
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/admin" className="font-semibold hover:text-accent">
            Admin
          </Link>
          <Link to="/" className="text-fg-muted hover:text-fg">
            Public site
          </Link>
        </nav>
        <Form
          method="post"
          action="/logout"
          className="flex items-center gap-3"
        >
          <span className="text-sm text-fg-muted">{loaderData.name}</span>
          <button type="submit" className={buttonClass("ghost")}>
            Sign out
          </button>
        </Form>
      </header>
      <Outlet />
    </div>
  );
}
