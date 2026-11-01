// Access tests for the admin area. The cookie-to-session lookup is stubbed;
// users and accounts are real rows, so the allowlist check runs against the
// database as it does in production.

import { RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../db/client";
import { account, user } from "../db/schema";
import { adminMiddleware, getAdmin, NO_STORE, safeAdminPath } from "./admin";
import { isAllowedGithubId } from "./allowlist";
import { auth, type Session } from "./auth";

const ADMIN_ID = "147697002";
const STRANGER_ID = "1";

beforeEach(() => {
  vi.stubEnv("ADMIN_GITHUB_IDS", ADMIN_ID);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Creates a user, optionally with a GitHub account, and signs them in. */
async function signIn(githubId: string | null) {
  const now = new Date();
  const [created] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: `user-${githubId}`,
      email: `${crypto.randomUUID()}@example.com`,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (githubId) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: created.id,
      providerId: "github",
      accountId: githubId,
      createdAt: now,
      updatedAt: now,
    });
  }

  vi.spyOn(auth.api, "getSession").mockResolvedValue({
    user: created,
    session: { id: "s", userId: created.id },
  } as Session as never);

  return created;
}

function signedOut() {
  vi.spyOn(auth.api, "getSession").mockResolvedValue(null as never);
}

/** Runs the middleware for a request to `path`. */
async function run(path: string, init?: RequestInit) {
  const context = new RouterContextProvider();
  const next = vi.fn(async () => new Response("ok"));
  const args = {
    request: new Request(`http://localhost${path}`, init),
    params: {},
    context,
  } as unknown as Parameters<typeof adminMiddleware>[0];

  try {
    const response = await adminMiddleware(args, next);
    return { response, thrown: undefined, next, context };
  } catch (thrown) {
    return { response: undefined, thrown, next, context };
  }
}

function expectRedirect(thrown: unknown, location: string) {
  expect(thrown).toBeInstanceOf(Response);
  const response = thrown as Response;
  expect(response.status).toBe(302);
  expect(response.headers.get("Location")).toBe(location);
  expect(response.headers.get("Cache-Control")).toBe(NO_STORE);
}

describe("adminMiddleware", () => {
  it("sends signed-out visitors to sign-in without running the route", async () => {
    signedOut();

    const { thrown, next } = await run("/admin/abc?tab=notes");

    expectRedirect(thrown, "/login?redirectTo=%2Fadmin%2Fabc%3Ftab%3Dnotes");
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks actions (POST) from signed-out visitors", async () => {
    signedOut();

    const { thrown, next } = await run("/admin/abc", {
      method: "POST",
      body: new URLSearchParams({ intent: "delete" }),
    });

    expect(thrown).toBeInstanceOf(Response);
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks a signed-in GitHub account that isn't on the allowlist", async () => {
    await signIn(STRANGER_ID);

    const { thrown, next } = await run("/admin", { method: "POST" });

    expectRedirect(thrown, "/login?redirectTo=%2Fadmin&error=not_allowed");
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks a signed-in user with no GitHub account", async () => {
    await signIn(null);

    const { thrown, next } = await run("/admin");

    expectRedirect(thrown, "/login?redirectTo=%2Fadmin&error=not_allowed");
    expect(next).not.toHaveBeenCalled();
  });

  it("lets the allowlisted account through and exposes it to routes", async () => {
    const admin = await signIn(ADMIN_ID);

    const { response, next, context } = await run("/admin", {
      method: "POST",
    });

    expect(next).toHaveBeenCalledOnce();
    expect(response?.headers.get("Cache-Control")).toBe(NO_STORE);
    expect(getAdmin(context).id).toBe(admin.id);
  });

  it("locks out an existing session once its ID leaves the allowlist", async () => {
    await signIn(ADMIN_ID);
    vi.stubEnv("ADMIN_GITHUB_IDS", "");

    const { thrown, next } = await run("/admin");

    expect(thrown).toBeInstanceOf(Response);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("sign-in gate", () => {
  const validate = auth.options.user?.validateUserInfo;

  function attempt(profileId: unknown, providerId = "github") {
    return validate?.({
      user: {},
      source: {
        action: "sign-in",
        method: "oauth",
        oauth: { providerId, profile: { id: profileId } },
      },
    } as never);
  }

  it("accepts the allowlisted GitHub ID as a number or string", async () => {
    expect(await attempt(Number(ADMIN_ID))).toBeUndefined();
    expect(await attempt(ADMIN_ID)).toBeUndefined();
  });

  it("rejects other GitHub IDs and other providers", async () => {
    expect(await attempt(STRANGER_ID)).toMatchObject({ error: "not_allowed" });
    expect(await attempt(ADMIN_ID, "google")).toMatchObject({
      error: "not_allowed",
    });
  });
});

describe("allowlist", () => {
  it("allows no one when unset or empty", () => {
    vi.stubEnv("ADMIN_GITHUB_IDS", "");
    expect(isAllowedGithubId(ADMIN_ID)).toBe(false);
  });

  it("ignores whitespace and non-numeric entries", () => {
    vi.stubEnv("ADMIN_GITHUB_IDS", ` ${ADMIN_ID} , poran-dip, `);
    expect(isAllowedGithubId(ADMIN_ID)).toBe(true);
    expect(isAllowedGithubId("poran-dip")).toBe(false);
    expect(isAllowedGithubId(undefined)).toBe(false);
  });
});

describe("safeAdminPath", () => {
  it("keeps admin paths", () => {
    expect(safeAdminPath("/admin")).toBe("/admin");
    expect(safeAdminPath("/admin/abc?tab=notes")).toBe("/admin/abc?tab=notes");
  });

  it("falls back to /admin for anything else", () => {
    for (const path of [
      null,
      "",
      "/",
      "/administrator",
      "//evil.example/admin",
      "https://evil.example/admin",
      "/login",
    ]) {
      expect(safeAdminPath(path)).toBe("/admin");
    }
  });
});
