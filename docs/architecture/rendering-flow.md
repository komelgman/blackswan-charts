# Rendering Flow Map

This is a map of the rendering flow and its boundaries. It is not a tutorial.

## Entry Points
- Viewport rendering components: `packages/charts-lib/src/components/ViewportWidget.vue`
- Price axis rendering components: `packages/charts-lib/src/components/PriceAxisWidget.vue`
- Time axis rendering components: `packages/charts-lib/src/components/TimeAxisWidget.vue`
- Layered canvas infrastructure: `packages/layered-canvas/src`

## Rendering Layers and Responsibilities
- Viewport layers live in `packages/charts-lib/src/model/chart/viewport/layers` and render grid, data, and highlighting.
- Axis label and marks layers live in `packages/charts-lib/src/model/chart/axis/layers`.
- Layer workers and canvas workers live under `packages/layered-canvas/src/model`.
- Sketchers and renderers live in `packages/charts-lib/src/model/chart/viewport/sketchers` and `packages/charts-lib/src/model/chart/viewport/sketchers/renderers`.

## Data and State Inputs
- Viewport model: `packages/charts-lib/src/model/chart/viewport/Viewport.ts`
- Price axis model: `packages/charts-lib/src/model/chart/axis/PriceAxis.ts`
- Time axis model: `packages/charts-lib/src/model/chart/axis/TimeAxis.ts`
- Data source entries: `packages/charts-lib/src/model/datasource/DataSource.ts`

## Invalidations and Re-render Triggers
- Viewport highlighting invalidation: `packages/charts-lib/src/model/chart/viewport/ViewportHighlightInvalidator.ts`
- Axis label invalidation and workers: `packages/charts-lib/src/model/chart/axis/label` and `packages/charts-lib/src/model/chart/axis/layers/workers`

## Hot Path Boundaries
- Rendering, hit-testing, and invalidation are hot paths. Follow the [hot-path guidance](../../AGENTS.md#hot-paths).

## Testable rendering boundaries
- Axis workers call `axis/layers/renderPriceLabels.ts` and `renderTimeLabels.ts`; grid worker calls `viewport/layers/renderViewportGrid.ts`.
- Functions accept a native 2D context and existing payload. Worker transport/lifetime remain in entry points; Node tests use the same geometry/style code.
- `tests/support/RecordingCanvas.ts` records paths, paint state and transforms, and supplies text metrics. It does not rasterize or perform native hit testing.
- `PriceLabelsInvalidator` projects scale-provided ticks, removes collisions, and caches caption widths by font/context. Vue watchers drive invalidation.
- Data-source tests run actual invalidators/sketchers/layers to detect stale rendering after updates and undo. Browser tests cover native Path2D hit testing and wiring.

- Price scales now own tick values and caption formatting; labels/marks share the formatter. See [price-scales.md](price-scales.md).
- Sketchers receive `DrawingProjection` instead of a viewport and update only display caches. Line/channel geometry is shared under `model/chart/drawing`; graphics render and hit-test those paths. Edit behaviors are independent of this flow. See [drawing-contracts.md](drawing-contracts.md).
