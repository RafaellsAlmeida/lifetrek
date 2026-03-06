import path from "path";
import {
  authStorageInit,
  setAuthProvider,
  configureAuthSession,
  authGlobalInit,
} from "@seontechnologies/playwright-utils/auth-session";
import supabaseAuthProvider from "./support/auth/supabase-auth-provider";

export default async function globalSetup() {
  authStorageInit();

  configureAuthSession({
    storageDir: path.resolve(process.cwd(), "playwright/auth-sessions"),
    debug: process.env.DEBUG_AUTH === "true",
  });

  setAuthProvider(supabaseAuthProvider);

  // Pre-fetch admin token so it's cached for all tests in this run.
  // Skipped gracefully when TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD are not set
  // (e.g., when running public-page tests only).
  if (process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD) {
    await authGlobalInit();
  }
}
