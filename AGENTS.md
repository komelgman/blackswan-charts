# Repository guidance

This repository is an npm workspace for the Vue/TypeScript charting library and its demo. Run commands from this directory (the `frontend` checkout); all paths below are relative to it.

## Project map

- `packages/charts-lib/src/model`: chart engine, axes, drawings, data sources, history, binding and rendering logic.
- `packages/charts-lib/src/components`: Vue chart widgets and event wiring.
- `packages/foundation/src`: shared geometry, types, utilities and event helpers.
- `packages/layout/src`: pane layout model and Vue components.
- `packages/layered-canvas/src`: canvas layers, workers, input events and Vue adapter.
- `packages/context-menu/src`: menu contracts, directive and Vue components.
- `apps/charts-demo`: consumer of the library's public API.
- `packages/charts-lib/tests`: unit, integration and browser component tests; see [TESTING.md](TESTING.md).

## Commands and validation

- Install: `npm install`; run the demo: `npm run dev`.
- Default tests: `npm test` (also `npm run test:node` / `npm run test:unit`), without a browser.
- Type checks: `npm run typecheck` uses `vue-tsc` and includes chart tests. Plain `tsc` does not validate Vue SFC internals.
- Build library and demo: `npm run build`.
- Browser adapters: `npm run test:ct`; demo smoke: `npm run build` then `npm run test:e2e`. Install Chromium first with `npx playwright install chromium`.
- Lint specific changed files with `npx eslint <files>`. `npm run lint` runs `eslint . --fix` across the repository and modifies files.
- Run checks appropriate to the change. For documentation-only edits, verify paths, links and commands; application tests are not required.
- Do not edit generated `dist`, reports, caches or test results.

## Dependency boundaries

- Applications consume package APIs; packages must not import application code. The chart API is `packages/charts-lib/src/index.ts`; do not deep-import chart implementation files from the demo.
- Components depend on models. Chart models must not import Vue SFCs, `@/components/*` or `@blackswan/*/components`.
- Chart models use `@blackswan/layout/model`, `@blackswan/layered-canvas/model`, `@blackswan/context-menu/types` and `@blackswan/foundation`. The former direct imports from UI component directories have been removed; see [ADR0005](docs/decisions/ADR0005-extract-layout-and-layered-canvas-packages.md).
- Layout, canvas and menu packages must not depend on chart internals. Keep shared contracts in the owning package's model/types exports.
- Vue reactivity remains part of the engine. Preserve its lifecycle and cleanup; do not introduce additional framework coupling without a concrete need.
- Keep domain state transitions and geometry in models; adapters own DOM measurement, browser events and component lifecycle.
- In charts-lib, use `@/…` for internal source imports and `@tests/…` for test helpers. Keep public barrel exports portable; other packages use their own configured paths.

## Changes and tests

- Prefer focused changes; avoid unrelated cleanup or abstractions without a concrete use case. Prioritize state correctness, hot-path performance and clear ownership.
- Changed behavior needs regression coverage, especially transactions/undo, shared drawings, dragging, scale conversions and persistence.
- Prefer Node unit/integration tests with real engine objects and explicit state/geometry assertions. Use browser tests for native hit testing, DOM measurement, workers and event wiring; screenshots must not be the functional oracle.
- Drawing identity is `(sourceId, drawingId)`: equal local IDs in different sources are valid. Preserve source ownership when merging incidents or restoring shared drawings.
- Changes to no-history mutation paths must verify that history is unaffected. Changes to shared drawings or persistence must cover their serialization and undo/redo invariants.
- Reuse existing test harnesses and rendering contracts; their limits and generated-test replay instructions are in [TESTING.md](TESTING.md).

## Hot paths

Rendering, hit testing, invalidation and continuous drag/zoom handlers are hot paths. Avoid avoidable allocations and indirection. Justify performance trade-offs with measurements or explicit reasoning about frequency and data size; document architectural exceptions.

## Architecture records

- Keep the [engine lifecycle](docs/architecture/engine-lifecycle.md) and [rendering flow](docs/architecture/rendering-flow.md) maps current when changing those flows. Scale extension and persistence contracts are in [price-scales.md](docs/architecture/price-scales.md).
- Record public API changes, new dependencies, boundary changes and significant performance trade-offs in the next numbered `docs/decisions/ADRNNNN-*.md`, linked from [DECISIONS.md](docs/decisions/DECISIONS.md).
- State the reason, scope, alternatives, evidence and consequences. Small local exceptions may use a `DECISION:` comment with an index entry; routine fixes do not need a separate decision record.
