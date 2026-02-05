# TESTING.md

This document summarizes the current frontend test stack and how to run and maintain it.

## Test Layers
- Unit tests: Vitest in `packages/charts-lib/tests/unit`.
- Component tests: Playwright Component Testing for Vue in `packages/charts-lib/tests/component`.
- E2E tests: Playwright in `apps/charts-demo/tests/e2e`.

## Run Commands (from `frontend/`)
- `npm run test:unit`
- `npm run test:ct`
- `npm run test:e2e`

## First-Time Setup
- `npm install`
- `npx playwright install`
- On CI or when using `vite preview`, run `npm run build` before `npm run test:e2e`.

## Component Test Harness
- The CT template is `packages/charts-lib/tests/component-template` and loads `packages/charts-lib/tests/component-template/index.ts`.
- `packages/charts-lib/tests/component-template/index.ts` exposes `window.__test_context` with `mount`, `delay`, `chart`, `idHelper`, `newDataSource`.
- Prefer adding helpers to `packages/charts-lib/tests/component/tools/utils.ts` instead of duplicating `page.evaluate` snippets.

## Snapshot Workflow
- Baselines live in `packages/charts-lib/tests/.component-snapshots`.
- Update snapshots intentionally with `npm run test:ct -- --update-snapshots` or `npx playwright test -c packages/charts-lib/playwright-ct.config.ts --update-snapshots`.
- Use explicit screenshot names when a test captures multiple states.

## Generated Artifacts
- Reports: `packages/charts-lib/tests/.component-report`, `apps/charts-demo/tests/.e2e-report`.
- CT build cache: `packages/charts-lib/tests/component-template/.cache`.
- These are generated and can be deleted if stale or large.

## Stability Tips
- Wait for Vue rendering before screenshots by calling `delay()` after `page.evaluate` mutations.
- Keep `test.use({ viewport: ... })` consistent across related screenshot tests.
- Prefer stable selectors such as `getByTestId` over layout-dependent CSS selectors.
- For long flows, use `test.slow()` and split into smaller tests when practical.
