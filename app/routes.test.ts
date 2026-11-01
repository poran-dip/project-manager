// Every /admin route must sit inside the admin layout, whose middleware is the
// auth check. A route added beside the layout instead would be public.

import type { RouteConfigEntry } from "@react-router/dev/routes";
import { describe, expect, it } from "vitest";
import { adminMiddleware } from "./.server/auth/admin";
import routes from "./routes";
import * as adminLayout from "./routes/admin/layout";

const ADMIN_LAYOUT = "routes/admin/layout.tsx";

type Flat = { path: string; file: string; ancestors: string[] };

function flatten(
  entries: RouteConfigEntry[],
  parentPath = "",
  ancestors: string[] = [],
): Flat[] {
  return entries.flatMap((entry) => {
    const path = [parentPath, entry.path].filter(Boolean).join("/");
    const self = { path, file: entry.file, ancestors };
    return [
      self,
      ...flatten(entry.children ?? [], path, [...ancestors, entry.file]),
    ];
  });
}

describe("routes", () => {
  const all = flatten(routes);

  it("puts every admin route inside the admin layout", () => {
    const admin = all.filter(
      (r) =>
        r.file !== ADMIN_LAYOUT &&
        (r.path === "admin" ||
          r.path.startsWith("admin/") ||
          r.file.startsWith("routes/admin/")),
    );

    expect(admin.length).toBeGreaterThan(0);
    for (const route of admin) {
      expect(route.ancestors, route.file).toContain(ADMIN_LAYOUT);
    }
  });

  it("runs the admin middleware on the admin layout", () => {
    expect(adminLayout.middleware).toContain(adminMiddleware);
  });
});
