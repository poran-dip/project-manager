import {
  index,
  layout,
  prefix,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  // Public.
  index("routes/home.tsx"),
  route("p/:slug", "routes/project.tsx"),

  // Auth.
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("api/auth/*", "routes/api.auth.ts"),

  // Admin.
  ...prefix("admin", [
    layout("routes/admin/layout.tsx", [
      index("routes/admin/index.tsx"),
      route("new", "routes/admin/new.tsx"),
      route("export", "routes/admin/export.ts"),
      route(":id", "routes/admin/project.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
