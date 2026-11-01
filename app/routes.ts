import {
  index,
  layout,
  prefix,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("api/auth/*", "routes/api.auth.ts"),

  ...prefix("admin", [
    layout("routes/admin/layout.tsx", [index("routes/admin/index.tsx")]),
  ]),
] satisfies RouteConfig;
