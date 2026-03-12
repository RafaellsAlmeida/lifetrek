# Story 5.3: Cross-Domain No-Regression Verification

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a release owner,
I want explicit no-regression verification for CRM and website domains,
so that content-engine delivery does not disrupt existing business operations.

## Acceptance Criteria

1. **Given** content-engine changes are prepared, **When** regression checklist runs, **Then** CRM and website key paths are validated.
2. **Given** regression risk is detected, **When** release gate evaluates, **Then** blocker is surfaced before production promotion.
3. **Given** no blockers remain, **When** release is approved, **Then** verification evidence is attached to release notes.

## Tasks / Subtasks

- [ ] Task 1: Define regression test suites for non-content domains (AC: #1)
  - [ ] 1.1 Create `playwright/tests/regression/crm-regression.spec.ts` with key CRM paths:
    - Admin login flow (extend existing `admin-auth.e2e.spec.ts` pattern)
    - Leads list loads without error
    - Lead detail page renders
    - Lead scoring displays (if visible in UI)
    - Lead email draft generation triggers without error
  - [ ] 1.2 Create `playwright/tests/regression/website-regression.spec.ts` with key public website paths:
    - Home page loads, hero section renders
    - Products page loads with product cards
    - About page renders
    - Blog listing page loads with posts
    - Blog post detail page renders (use first available post)
    - Contact form renders (don't submit)
    - Language switcher works (PT-BR ↔ EN)
  - [ ] 1.3 Create `playwright/tests/regression/admin-regression.spec.ts` with key admin paths:
    - Dashboard loads
    - Blog management page loads
    - Content approval page loads
    - Analytics page loads
    - Orchestrator page loads
  - [ ] 1.4 Each test should be a smoke test (page loads, key elements visible) — not deep functional testing

- [ ] Task 2: Create regression test runner script (AC: #1, #2)
  - [ ] 2.1 Add npm script: `"test:regression": "playwright test --project=regression"` in `package.json`
  - [ ] 2.2 Add Playwright project config in `playwright.config.ts`:
    ```typescript
    {
      name: 'regression',
      testDir: './playwright/tests/regression',
      use: { ...devices['Desktop Chrome'] },
    }
    ```
  - [ ] 2.3 Ensure regression tests can run against all environments via `TEST_ENV` env var (local, staging, production)
  - [ ] 2.4 Generate HTML report: `playwright show-report` after run

- [ ] Task 3: Create CI workflow for regression checks (AC: #2)
  - [ ] 3.1 Create `.github/workflows/regression-check.yml`:
    - Trigger: on pull request to `main` branch
    - Steps: checkout, install deps, build, start dev server, run `npm run test:regression`
    - Upload test results as artifacts
    - Fail the PR check if any regression test fails
  - [ ] 3.2 Add status check badge to the workflow
  - [ ] 3.3 Use `TEST_ENV=local` for CI runs (no external dependencies)
  - [ ] 3.4 Cache node_modules and Playwright browsers for faster CI

- [ ] Task 4: Create pre-release regression checklist (AC: #2, #3)
  - [ ] 4.1 Create `scripts/regression-checklist.ts` (Deno script):
    - Runs Playwright regression suite
    - Collects pass/fail results
    - Generates a markdown summary report
    - Outputs to `_bmad-output/implementation-artifacts/regression-report-{date}.md`
  - [ ] 4.2 Report format:
    ```markdown
    # Regression Report — {date}

    ## Summary
    - CRM: {pass_count}/{total} passed
    - Website: {pass_count}/{total} passed
    - Admin: {pass_count}/{total} passed

    ## Blockers
    - [list any failed tests with descriptions]

    ## Evidence
    - Screenshots: test-results/
    - Full report: playwright-report/
    ```
  - [ ] 4.3 Exit code: 0 if all pass, 1 if any blocker

- [ ] Task 5: Document regression process (AC: #3)
  - [ ] 5.1 Add a "Regression Testing" section to `TESTING_GUIDE.md`:
    - How to run: `npm run test:regression`
    - When to run: before any production deployment, after content-engine epic completion
    - What it covers: CRM paths, website paths, admin paths
    - How to read results: HTML report + markdown summary
  - [ ] 5.2 Add regression checklist to the epic retrospective template — "Did regression tests pass before release?"

## Dev Notes

### Existing Test Infrastructure

Current Playwright setup (`playwright.config.ts`):
- Tests in `playwright/tests/` with `e2e/`, `api/`, `ui/` subdirectories
- Uses `TEST_ENV` env var for environment selection
- Existing test: `admin-auth.e2e.spec.ts` — admin login flow (can be referenced as pattern)
- Screenshots on failure go to `test-results/`

### Test Philosophy

These are **smoke tests**, not comprehensive functional tests:
- Each test verifies a page loads and key elements render
- No deep interaction testing (that's covered by domain-specific tests)
- Goal: catch accidental breakage from content-engine changes (wrong import, deleted component, broken route)
- Fast execution: all regression tests should complete in < 2 minutes

### Authentication for Admin Tests

Admin tests need credentials. Follow existing pattern from `admin-auth.e2e.spec.ts`:
- `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` env vars
- Skip gracefully if credentials not available (CI may not have them for public PRs)
- Use existing auth helper if available

### Files to Create

- `playwright/tests/regression/crm-regression.spec.ts`
- `playwright/tests/regression/website-regression.spec.ts`
- `playwright/tests/regression/admin-regression.spec.ts`
- `.github/workflows/regression-check.yml`
- `scripts/regression-checklist.ts`

### Files to Modify

- `package.json` — add `test:regression` script
- `playwright.config.ts` — add `regression` project
- `TESTING_GUIDE.md` — add regression testing section

### What NOT to Do

- Do NOT write deep functional tests — these are smoke tests for regression detection
- Do NOT test content generation flows — those are covered by content-specific tests
- Do NOT test external services (Resend, OpenRouter) — only test internal UI/API paths
- Do NOT make tests flaky by depending on specific data — use existence checks, not exact value assertions
- Do NOT add database seeding — tests should work with whatever data exists (or handle empty states gracefully)
- Do NOT block deployments for non-critical test failures — clearly distinguish blockers from warnings

### Architecture Compliance

- **Testing:** Playwright 1.57.0, standard project pattern
- **CI:** GitHub Actions, artifact upload for evidence
- **Naming:** kebab-case for workflow files, spec suffix for tests
- **Environment:** `TEST_ENV` env var for environment selection
- **Evidence:** HTML report + markdown summary for release documentation

### Testing Requirements

- Run `npm run test:regression` locally → all tests pass against local dev server
- Run with `TEST_ENV=staging` → tests pass against staging
- CI workflow triggers on PR → regression check appears as status check
- When a regression test fails → CI blocks the PR with clear failure message
- Regression report generates → markdown file with pass/fail summary
- Run `npm run build` — must pass
- Run `npm run lint` — no new warnings

### Cross-Story Context

- **All Epic 1-4 stories**: These are the content-engine changes that could cause regressions. This story provides the safety net.
- **Story 5.1** (Real Asset First): Changes image generation paths — regression tests verify admin pages still load
- **Story 5.2** (Access & Audit): Changes RLS policies — regression tests verify pages still load for authenticated users

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-53-cross-domain-no-regression-verification]
- [Source: _bmad-output/planning-artifacts/architecture.md — brownfield safety lines 57-58]
- [Source: playwright/tests/e2e/admin-auth.e2e.spec.ts — existing test pattern]
- [Source: TESTING_GUIDE.md — testing documentation]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

