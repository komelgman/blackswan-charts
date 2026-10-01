# Testing

## Default: no browser

Run `npm install`, then `npm test` (alias: `npm run test:node`). All Node suites run once and exit; browser binaries, a display and system fonts are not required. `npm run test:unit` runs the same suites for compatibility.

- `packages/foundation/tests/unit`: utilities.
- `packages/layout/tests/pane-layout.spec.ts`: production pane allocation/resize, constraints and generated layouts.
- `packages/charts-lib/tests/unit`: isolated engine behavior.
- `packages/charts-lib/tests/integration`: real Chart, sources, interconnect, history, axes and rendering with controlled boundary inputs.
- Only chart integrations: `npm -w packages/charts-lib run test:integration`.

## What replaced screenshots

| Former coverage | Current contract |
| --- | --- |
| One/two/three panes, preferred/min/max sizes, simultaneous/stepwise creation | Layout tests assert dimensions and conservation of space. Two browser cases check mount and DOM measurement wiring. |
| HLine/VLine, dash styles, local and shared drawings | `Rendering.spec.ts` asserts paths, coordinates, stroke width/color/dashes, visibility and projection targets. |
| Labels, grid, DPR | Actual worker drawing functions run against `RecordingCanvas`; `AxisTextMetrics.spec.ts` checks remeasurement with supplied metrics. |
| Long actions/undo/redo sequence | `ChartHistory.spec.ts` checks semantic state, each intermediate undo/redo and geometry. Includes pan, resize, shared drag, clone, inversion, scale, zoom, pane visibility/order/removal and styles. |
| Mutual effects of actions | `GeneratedHistory.spec.ts` compares every executed command with an independent snapshot oracle and tests 144 ordered action pairs. |
| Native hit testing and events | Six Playwright component tests retain real Canvas hit testing, drag, wheel zoom, keyboard shortcuts, menu, resize and mount wiring. No PNG assertions. |

`chartHarness` uses real objects and Vue effect scopes, fixed dimensions (800x600), a recording Canvas/Path2D and controlled timers. It installs/removes viewport listeners and real invalidation/render layers. It does not emulate native hit testing, rasterization, workers or CSS. Unsupported Canvas methods fail explicitly. Explicit geometry/style expectations validate rendering; undo frame comparisons supplement the independent state oracle.

`observeChart` detaches state including shared projections. Persistence serialization alone is insufficient because it omits those projections. Tests also assert undo/redo availability, selection references and source notifications. Identity remains `(sourceId, drawingId)`; equal local IDs across sources are intentional regression fixtures.

## Generation and replay

Defaults: 100 reproducible sequences of up to 50 command candidates, seed `20260928`, plus 200 generated layout/drag cases. Domain preconditions skip inapplicable commands. Commands cover drawings, sharing at creation, panes, axes, multi-source transactions, clear/undo/redo. Drag, clone, timed grouping and geometry have deterministic integration coverage.

Fast-check shrinks failures and prints seed, path and command trace. Replay from PowerShell:

```powershell
$env:FC_SEED = '20260928'
$env:FC_PATH = '<path printed by fast-check>'
$env:FC_REPLAY_PATH = '<commands replayPath, when present>'
npm -w packages/charts-lib run test:integration
Remove-Item Env:FC_SEED, Env:FC_PATH, Env:FC_REPLAY_PATH -ErrorAction SilentlyContinue
```

`FC_RUNS` and `FC_COMMANDS` enable longer runs; preserve their original values when replaying. Clear overrides afterward. Convert useful minimized failures into named regressions. CI may supply additional seeds for wider exploration.

Model scope excludes live content binding, dynamic `shareWith` changes (production TODO), unimplemented drawing reorder APIs and arbitrary nested transaction programs. Existing unit tests cover binding/storage. Generation is not exhaustive proof of every sequence.

## Browser boundaries

Install Chromium once: `npx playwright install chromium`.

- `npm run test:ct`: six component adapter checks, no screenshot/font baselines.
- `npm run build` then `npm run test:e2e`: demo smoke; CI previews the built application.
- `npm run typecheck`: production plus all charts-lib unit/integration/support/component and layout test types.

CT template: `packages/charts-lib/tests/component-template`, exposing `window.__test_context`. Poll observable conditions; Vue nextTick does not guarantee workers finished. Old PNG baselines remain historical artifacts; no active test reads them. Optional visual tests should validate an explicit visual contract, not gate functional tests.

Reports/caches: `packages/charts-lib/tests/.component-report`, `packages/charts-lib/tests/component-template/.cache`, `apps/charts-demo/tests/.e2e-report`.

`packages/charts-lib/tests/tsconfig.json` owns the whole test directory for editor discovery; `tsconfig.vitest.json` extends it for CLI checks. Both inherit explicit `moduleResolution: bundler` from the workspace base, which resolves package subpath exports such as `@blackswan/layered-canvas/model`. Production imports use `@/…`; test helpers use `@tests/…`. The aliases are shared by TypeScript, Vite/Vitest and Playwright CT. Tests outside a configured project previously fell back to editor defaults and could report TS2307 even when the narrower CLI check passed.

## Scale contracts

`ScaleInteractions.spec.ts` covers ordinary/log axis and drawing combinations, inversion, body/handle drags, undo/redo, tiny values, and 200 generated label ranges. `PercentageScale.spec.ts` checks first-visible-close rebasing, data updates, registration/menu, JSON and history. A browser case verifies mixed-scale dragging with native pointer events. See [price-scales.md](docs/architecture/price-scales.md) for extension contracts.

`PriceLabelDensity.spec.ts` checks density, maximum uncovered distance, gap uniformity (largest/smallest at most 1.5 with numerical tolerance), non-overlap, edge clipping and caption/coordinate agreement without rendering. It covers ordinary/log/percentage scales, signed and zero-crossing ranges, very small/large and narrow prices, inversion, fonts and pane heights, including collapse/reopen. Systematic magnitudes span 1e-300..1e300; 1000 generated combinations span base exponents -280..280 with seed `20260928`. Fixed regressions include the single `500` label in 300..800, uneven decimal transitions, rounding failures and missing ticks near spacing thresholds. Inversion/pan tests check grid stability. Failures print a minimized counterexample and replay path. Extreme-range projection, batch coordinates, shifts and padding are also covered in `PriceAxis.spec.ts`.

`PriceLabelZoom.spec.ts` checks repeated wheel-sized zoom increments in both directions, three cursor positions, both axis orientations, signed/tiny/large ranges, and grouped undo/redo. The cursor price stays fixed; retained labels move according to the viewport transform; price levels change at density thresholds rather than every event. A native browser wheel case verifies the actual event coordinates and reactive label update.

## Drawing boundaries and gallery

`DrawingBehavior.spec.ts` edits channels without a renderer, checks either boundary in mixed/inverted scales, tests all handles and JSON restore, and registers the same extension under a new type name. Existing line/axis/history contracts remain regression coverage. Drawing/sketcher imports are constrained by ESLint; their contracts and migration are in [drawing-contracts.md](docs/architecture/drawing-contracts.md).

The demo E2E suite covers the gallery's eleven deep-linked examples, category/search navigation, bounded canvas dimensions, source/Vue/tooltip tabs and GitHub links, reset, channel button/native handle edits, streaming pause/step/reset, grouped edits and JSON restore, scale actions, common percentage rebasing and mobile overflow. It uses no screenshot assertions. `npm run build` followed by `CI=1 npm run test:e2e` tests packaged assets (set `$env:CI='1'` in PowerShell). `PLAYWRIGHT_PORT` overrides the default 5173 when another local server is running. Development mode uses Vite source imports; production includes the library's exported stylesheet.

`apps/charts-demo/tests/unit/gallery.spec.ts` runs scenes in Node with controlled timers: distinct market series, shared/local drawing ownership and undo, candle/volume appends, pause/resume/disposal, bounded retention, native AUTO/justFollow, zoom preservation, manual-pan cancellation and visible-price fitting. Preferred ranges are driven through public sketcher/cache APIs, without Canvas rendering. Object event tests validate handler delegation, selection and source/object identity; the browser checks native hit testing and tooltip display, including DPR 2 after a container resize. Viewport unit tests verify body/handle coordinates at DPR 1, 1.25, 2 and 3. It is included in `npm test`; run just these checks with `npm -w apps/charts-demo run test:unit`.

`scales.spec.ts` uses the public sketcher to verify that equal-endpoint trends swap straight/curved geometry when the axis changes, while their own interpolation spaces and data stay fixed. `percentage.spec.ts` verifies a single primary reference across three sources, rebasing on pan, independence from secondary-data updates and undo/redo without rewriting the other prices. Both run in Node without Canvas rendering.

`layout-dpr.spec.ts` checks three panes and the timeline fit their chart at DPR 2 on desktop and mobile, including container resize, exact CSS divider movement and undo/redo before and after resize.
