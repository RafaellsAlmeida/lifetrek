# LifeTrek — Playwright Test Suite

## Quick Start

```bash
# 1. Copy env template and fill in credentials
cp .env.example .env
# Set TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

# 2. Install deps (if not done)
npm install

# 3. Install Playwright browsers (if not done)
npx playwright install --with-deps

# 4. Run all tests
npm run test:e2e
```

## Running Tests

| Command | Description |
|---|---|
| `npm run test:e2e` | All tests (local env, headless) |
| `npm run test:e2e:ui` | Playwright interactive UI |
| `npm run test:e2e:headed` | All tests in headed browser |
| `npm run test:e2e:debug` | Debug mode with inspector |
| `npm run test:api` | API/service layer tests only |
| `npm run test:e2e:staging` | Run against staging environment |
| `npm run test:e2e:production` | Run against production environment |

## Environment Control

```bash
# Environment switching via TEST_ENV
TEST_ENV=local npm run test:e2e      # default
TEST_ENV=staging npm run test:e2e
TEST_ENV=production npm run test:e2e

# Override base URL
PLAYWRIGHT_BASE_URL=http://localhost:8080 npm run test:e2e
```

## Directory Structure

```
playwright/
├── auth-sessions/         # Cached auth tokens (gitignored — never commit)
├── config/
│   ├── base.config.ts     # Base Playwright config (timeouts, reporters, globalSetup)
│   ├── local.config.ts    # Local dev overrides + webServer
│   ├── staging.config.ts  # Staging env config
│   └── production.config.ts
├── global-setup.ts        # Initializes Supabase auth session before tests
├── support/
│   ├── merged-fixtures.ts # Single test object — import { test } from here in ALL tests
│   ├── auth/
│   │   └── supabase-auth-provider.ts   # Supabase email/password auth provider
│   ├── factories/
│   │   ├── lead.factory.ts             # createLead / createQualifiedLead
│   │   └── content.factory.ts          # createContentPost / createBlogPost
│   └── helpers/
│       └── supabase.helper.ts          # supabaseSelect / supabaseInsert / supabaseDelete
└── tests/
    ├── api/               # API/service layer tests (no browser)
    │   └── resources.api.spec.ts
    ├── ui/                # Full E2E UI tests (with browser)
    │   └── resources.ui.spec.ts
    └── e2e/               # Admin / authenticated E2E tests
```

## Test Architecture

### Fixtures

Always import `test` from `support/merged-fixtures.ts` — never from `@playwright/test` directly:

```typescript
import { test, expect } from "../support/merged-fixtures";

test("example", async ({ page, request, authToken }) => {
  // authToken — Supabase access_token for admin (from auth-session utility)
  // request   — Playwright APIRequestContext
  // page      — Playwright Page
});
```

### Auth Setup

Admin auth is pre-fetched in `global-setup.ts` and cached to `playwright/auth-sessions/`.

For **UI tests** that need admin access, set the storage state:

```typescript
test.use({
  storageState: "playwright/auth-sessions/local/admin/storage-state.json",
});

test("admin can see dashboard", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("Dashboard")).toBeVisible();
});
```

For **API tests** that need auth:

```typescript
test("authenticated API call", async ({ request, authToken }) => {
  const response = await request.get(`${process.env.VITE_SUPABASE_URL}/rest/v1/leads`, {
    headers: {
      apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      Authorization: `Bearer ${authToken}`,
    },
  });
  expect(response.status()).toBe(200);
});
```

### Factories

Use factories to create test data — never hardcode values:

```typescript
import { createLead, createQualifiedLead } from "../support/factories/lead.factory";
import { createBlogPost } from "../support/factories/content.factory";

const lead = createLead({ company: "Acme Corp" });   // overrides supported
const qualified = createQualifiedLead();              // status: qualified, score: 80
const post = createBlogPost({ language: "pt" });
```

### Supabase Helpers

```typescript
import { supabaseSelect, supabaseInsert, supabaseDelete } from "../support/helpers/supabase.helper";

// Select
const { body } = await supabaseSelect(request, "leads", { status: "eq.new" }, authToken);

// Insert
await supabaseInsert(request, "leads", createLead(), authToken);

// Cleanup
await supabaseDelete(request, "leads", { email: `eq.${lead.email}` }, authToken);
```

## Best Practices

**Selectors**
- Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
- Use `data-testid` attributes for elements with no semantic role
- Avoid XPath

**Test Isolation**
- Each test creates its own data via factories
- Clean up after yourself using `afterEach` or fixture teardown
- Never depend on test execution order

**Setup Speed**
- Seed data via API (helpers), not UI navigation — 10-50x faster
- Use `waitForLoadState("networkidle")` only when needed — prefer `expect` assertions

**Cleanup Pattern**
```typescript
test("creates and cleans up a lead", async ({ request, authToken }) => {
  const lead = createLead();
  await supabaseInsert(request, "leads", lead, authToken);

  // ... test logic ...

  // Cleanup
  await supabaseDelete(request, "leads", { email: `eq.${lead.email}` }, authToken);
});
```

## CI Integration

Tests run automatically on every PR via GitHub Actions (see `.github/workflows/`).

- `TEST_ENV=staging` against the staging Supabase project
- HTML report uploaded as artifact on failure
- JUnit XML report for PR annotations

## Debugging Failures

```bash
# Open trace viewer for last failed test
npx playwright show-trace test-results/*/trace.zip

# Run single test file with verbose output
npx playwright test playwright/tests/ui/resources.ui.spec.ts --headed

# Screenshot on failure is automatic — check test-results/
```
