import { mergeTests, test as base } from "@playwright/test";
import { test as apiRequestFixture } from "@seontechnologies/playwright-utils/api-request/fixtures";
import { test as logFixture } from "@seontechnologies/playwright-utils/log/fixtures";
import { test as networkErrorMonitorFixture } from "@seontechnologies/playwright-utils/network-error-monitor/fixtures";
import { setAuthProvider } from "@seontechnologies/playwright-utils/auth-session";
import supabaseAuthProvider from "./auth/supabase-auth-provider";

// Register Supabase provider once at module load
setAuthProvider(supabaseAuthProvider);

/**
 * authToken fixture — provides the admin Supabase JWT access_token.
 *
 * The global setup pre-caches the token on disk. If credentials are not set
 * (e.g., public-page tests only) the fixture silently yields an empty string.
 *
 * Usage:
 *   test("api call", async ({ request, authToken }) => {
 *     const res = await request.get(`${SUPABASE_URL}/rest/v1/table`, {
 *       headers: { Authorization: `Bearer ${authToken}` }
 *     });
 *   });
 */
const authBase = base.extend<{ authToken: string }>({
  authToken: async ({ request }, use) => {
    try {
      const storageState = await supabaseAuthProvider.manageAuthToken(request);
      const token = supabaseAuthProvider.extractToken(
        storageState as Record<string, unknown>
      );
      // Playwright fixture callback uses the conventional "use" name.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(token ?? "");
    } catch {
      // Auth not configured — tests that need it must call test.skip()
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use("");
    }
  },
});

export const test = mergeTests(
  apiRequestFixture,
  authBase,
  logFixture,
  networkErrorMonitorFixture
);

export { expect } from "@playwright/test";
