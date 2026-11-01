// The admin check. Every admin loader and action runs behind
// `adminMiddleware`, set on the admin layout route.

import { and, eq } from "drizzle-orm";
import {
  createContext,
  type MiddlewareFunction,
  type RouterContextProvider,
  redirect,
} from "react-router";
import { db } from "../db/client";
import { account } from "../db/schema";
import { isAllowedGithubId } from "./allowlist";
import { auth, type Session } from "./auth";

/** Response header for admin pages, so no shared cache ever stores them. */
export const NO_STORE = "private, no-store";

/** The signed-in admin, set by `adminMiddleware` for admin routes. */
export type Admin = Session["user"];

const adminContext = createContext<Admin>();

/** Who is making the request, as far as the admin area is concerned. */
export type AdminStatus =
  | { kind: "anonymous" }
  | { kind: "forbidden"; user: Session["user"] }
  | { kind: "admin"; user: Admin };

/**
 * Resolves the request's session and checks that its user has a GitHub
 * account on the allowlist. Sign-in already rejects strangers; this checks
 * again on every request so taking an ID off the allowlist locks that
 * account out immediately, not at its next sign-in.
 */
export async function getAdminStatus(headers: Headers): Promise<AdminStatus> {
  const session = await auth.api.getSession({ headers });

  if (!session) return { kind: "anonymous" };

  const accounts = await db
    .select({ accountId: account.accountId })
    .from(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "github"),
      ),
    );

  const allowed = accounts.some((a) => isAllowedGithubId(a.accountId));

  return allowed
    ? { kind: "admin", user: session.user }
    : { kind: "forbidden", user: session.user };
}

/**
 * Only allows admin paths as post-sign-in destinations, so `redirectTo`
 * can't send someone to another site.
 */
export function safeAdminPath(path: string | null | undefined): string {
  if (path && /^\/admin(?:[/?#]|$)/.test(path)) return path;

  return "/admin";
}

/**
 * Guards a route and all of its children. Signed-out visitors go to the
 * sign-in page; signed-in users who aren't admins go there with an error.
 * Every response, including redirects, is marked `private, no-store`.
 */
export const adminMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const status = await getAdminStatus(request.headers);

  if (status.kind !== "admin") {
    const url = new URL(request.url);
    const params = new URLSearchParams({
      redirectTo: url.pathname + url.search,
    });

    if (status.kind === "forbidden") params.set("error", "not_allowed");

    throw redirect(`/login?${params}`, {
      headers: { "Cache-Control": NO_STORE },
    });
  }

  context.set(adminContext, status.user);

  const response = await next();
  response.headers.set("Cache-Control", NO_STORE);

  return response;
};

/** The signed-in admin. Call only from routes under `adminMiddleware`. */
export function getAdmin(context: Readonly<RouterContextProvider>): Admin {
  return context.get(adminContext);
}
