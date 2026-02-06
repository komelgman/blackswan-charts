# Rendering Flow Map

This is a map of the rendering flow and its boundaries. It is not a tutorial.

## Entry Points
- Viewport rendering components: `frontend/packages/charts-lib/src/components/chart/ViewportWidget.vue`
- Price axis rendering components: `frontend/packages/charts-lib/src/components/chart/PriceAxisWidget.vue`
- Time axis rendering components: `frontend/packages/charts-lib/src/components/chart/TimeAxisWidget.vue`
- Layered canvas infrastructure: `frontend/packages/charts-lib/src/components/layered-canvas`

## Rendering Layers and Responsibilities
- Viewport layers live in `frontend/packages/charts-lib/src/model/chart/viewport/layers` and render grid, data, and highlighting.
- Axis label and marks layers live in `frontend/packages/charts-lib/src/model/chart/axis/layers`.
- Layer workers and canvas workers live under `frontend/packages/charts-lib/src/components/layered-canvas/model`.
- Sketchers and renderers live in `frontend/packages/charts-lib/src/model/chart/viewport/sketchers` and `frontend/packages/charts-lib/src/model/chart/viewport/sketchers/renderers`.

## Data and State Inputs
- Viewport model: `frontend/packages/charts-lib/src/model/chart/viewport/Viewport.ts`
- Price axis model: `frontend/packages/charts-lib/src/model/chart/axis/PriceAxis.ts`
- Time axis model: `frontend/packages/charts-lib/src/model/chart/axis/TimeAxis.ts`
- Data source entries: `frontend/packages/charts-lib/src/model/datasource/DataSource.ts`

## Invalidations and Re-render Triggers
- Viewport highlighting invalidation: `frontend/packages/charts-lib/src/model/chart/viewport/ViewportHighlightInvalidator.ts`
- Axis label invalidation and workers: `frontend/packages/charts-lib/src/model/chart/axis/label` and `frontend/packages/charts-lib/src/model/chart/axis/layers/workers`

## Hot Path Boundaries
- Rendering, hit-testing, and invalidation are hot paths. Changes here must follow the Hot Paths policy in `frontend/AGENTS.md`.
