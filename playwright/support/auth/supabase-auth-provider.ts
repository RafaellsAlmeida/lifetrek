import type { AuthProvider } from "@seontechnologies/playwright-utils/auth-session";
import type { AuthOptions } from "@seontechnologies/playwright-utils/auth-session";

function getProjectRef(supabaseUrl: string): string {
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : "unknown";
}

/**
 * Decodes a JWT payload and checks the `exp` claim.
 * Supabase access tokens are standard JWTs with base64url-encoded payloads.
 */
function jwtIsExpired(rawToken: string): boolean {
  try {
    const [, payload] = rawToken.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Date.now() > decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * AuthProvider implementation for Supabase email/password authentication.
 *
 * Flow:
 * 1. manageAuthToken() calls Supabase /auth/v1/token and returns a Playwright-compatible
 *    storage state. The library saves this to disk as JSON.
 * 2. extractToken() reads from that saved JSON and returns the raw access_token (JWT).
 * 3. isTokenExpired() decodes the JWT and checks the exp claim.
 * 4. UI tests that need browser auth use test.use({ storageState: <saved file> }).
 */
const supabaseAuthProvider: AuthProvider = {
  getEnvironment: (options?: Partial<AuthOptions>) =>
    options?.environment || process.env.TEST_ENV || "local",

  getUserIdentifier: (options?: Partial<AuthOptions>) =>
    options?.userIdentifier || "admin",

  /**
   * tokenData is the JSON-parsed storage state returned by manageAuthToken.
   * Extract the Supabase access_token from the localStorage entry.
   */
  extractToken: (tokenData: Record<string, unknown>): string | null => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const projectRef = getProjectRef(supabaseUrl);
    try {
      const origins = tokenData.origins as Array<{
        localStorage: Array<{ name: string; value: string }>;
      }>;
      const entry = origins?.[0]?.localStorage?.find(
        (item) => item.name === `sb-${projectRef}-auth-token`
      );
      if (!entry) return null;
      const session = JSON.parse(entry.value);
      return session.access_token ?? null;
    } catch {
      return null;
    }
  },

  /** Return empty — Supabase stores its session in localStorage, not cookies. */
  extractCookies: () => [],

  /** rawToken is the JWT string returned by extractToken. */
  isTokenExpired: (rawToken: string): boolean => jwtIsExpired(rawToken),

  /**
   * Calls Supabase email/password auth and returns a Playwright-compatible storage state.
   * The library saves this to {authStoragePath}/{env}/{user}/storage-state.json.
   * UI tests reference that file via test.use({ storageState: <path> }).
   */
  manageAuthToken: async (
    request,
    options?: Partial<AuthOptions>
  ): Promise<Record<string, unknown>> => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    const isAdmin = !options?.userIdentifier || options.userIdentifier === "admin";
    const email = isAdmin ? process.env.TEST_ADMIN_EMAIL : process.env.TEST_USER_EMAIL;
    const password = isAdmin
      ? process.env.TEST_ADMIN_PASSWORD
      : process.env.TEST_USER_PASSWORD;

    if (!supabaseUrl || !anonKey) {
      throw new Error(
        "Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY"
      );
    }
    if (!email || !password) {
      throw new Error(
        `Missing test credentials for "${options?.userIdentifier ?? "admin"}": set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env`
      );
    }

    const response = await request.post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        data: { email, password },
      }
    );

    if (!response.ok()) {
      throw new Error(
        `Supabase auth failed (${response.status()}): ${await response.text()}`
      );
    }

    const session = await response.json();
    const projectRef = getProjectRef(supabaseUrl);
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";

    // Return a Playwright-compatible storage state so:
    // a) the library saves it as the token cache on disk
    // b) UI tests can use it as storageState to restore the Supabase browser session
    return {
      cookies: [],
      origins: [
        {
          origin: baseUrl,
          localStorage: [
            {
              name: `sb-${projectRef}-auth-token`,
              value: JSON.stringify(session),
            },
          ],
        },
      ],
    };
  },

  /** No-op — the library handles cache eviction via storage file removal. */
  clearToken: () => {},
};

export default supabaseAuthProvider;
