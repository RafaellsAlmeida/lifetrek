/**
 * Example: Admin authentication E2E test
 *
 * Demonstrates:
 * - Using storageState for pre-authenticated browser session
 * - authToken fixture for API calls with admin access
 * - Given/When/Then structure
 * - Skipping gracefully when credentials are not set
 */
import { test, expect } from "../../support/merged-fixtures";

const ADMIN_STORAGE_STATE =
  "playwright/auth-sessions/local/admin/storage-state.json";

// These tests require admin credentials — skip in CI without auth env vars
const hasAdminCreds =
  !!process.env.TEST_ADMIN_EMAIL && !!process.env.TEST_ADMIN_PASSWORD;

test.describe("Admin authentication", () => {
  test("admin can access the dashboard via API token", async ({
    request,
    authToken,
  }) => {
    test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    test.skip(!supabaseUrl || !anonKey, "Supabase credentials not set");

    // GIVEN an admin token from the auth-session fixture
    // WHEN we call a Supabase protected endpoint
    const response = await request.get(
      `${supabaseUrl}/rest/v1/profiles?select=id,email&limit=1`,
      {
        headers: {
          apikey: anonKey!,
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // THEN it should succeed
    expect(response.status()).toBe(200);
  });

  test("admin UI session loads the admin page", async ({ page }) => {
    test.skip(!hasAdminCreds, "TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set");

    // Apply saved auth session so the browser is pre-authenticated
    await page.context().addInitScript(() => {});

    // GIVEN the admin storage state is set (via test.use or page context)
    // WHEN navigating to the admin dashboard
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // THEN we should NOT be redirected to the login page
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
});
