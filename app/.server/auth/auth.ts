// Better Auth server instance.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { isAllowedGithubId } from "./allowlist";
import { requireEnv } from "./env";

export const auth = betterAuth({
  baseURL: requireEnv("BETTER_AUTH_URL"),
  secret: requireEnv("BETTER_AUTH_SECRET"),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    transaction: true,
  }),
  socialProviders: {
    github: {
      clientId: requireEnv("GITHUB_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    },
  },
  // OAuth errors that can't be tied to a sign-in attempt (expired or forged
  // state) land on the sign-in page instead of Better Auth's default page.
  onAPIError: { errorURL: "/login" },
  user: {
    // Runs with the fresh GitHub profile on sign-up and on every sign-in, so
    // a stranger is turned away before any row is written, and removing an
    // ID from the allowlist blocks that account's next sign-in.
    validateUserInfo: ({ source }) => {
      if (
        source.oauth?.providerId === "github" &&
        isAllowedGithubId(source.oauth.profile?.id)
      ) {
        return;
      }

      return {
        error: "not_allowed",
        errorDescription: "This GitHub account can't sign in here.",
      };
    },
  },
});

export type Session = typeof auth.$Infer.Session;
