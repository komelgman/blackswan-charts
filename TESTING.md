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
| Native hit testing and events | Four Playwright component tests retain real Canvas hit testing, drag, keyboard shortcuts, menu, resize and mount wiring. No PNG assertions. |

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

- `npm run test:ct`: four component adapter checks, no screenshot/font baselines.
- `npm run build` then `npm run test:e2e`: demo smoke; CI previews the built application.
- `npm run typecheck`: production plus new integration/support/component and layout test types.

CT template: `packages/charts-lib/tests/component-template`, exposing `window.__test_context`. Poll observable conditions; Vue nextTick does not guarantee workers finished. Old PNG baselines remain historical artifacts; no active test reads them. Optional visual tests should validate an explicit visual contract, not gate functional tests.

Reports/caches: `packages/charts-lib/tests/.component-report`, `packages/charts-lib/tests/component-template/.cache`, `apps/charts-demo/tests/.e2e-report`.
