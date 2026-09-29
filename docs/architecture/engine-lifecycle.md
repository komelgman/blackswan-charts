# Engine Lifecycle Map

This is a map of the chart engine lifecycle. It is not a tutorial.

## Primary Entry Points
- Public API exports: `packages/charts-lib/src/index.ts`
- Engine orchestrator: `packages/charts-lib/src/model/chart/Chart.ts`
- Data source model: `packages/charts-lib/src/model/datasource/DataSource.ts`
- Data binding: `packages/charts-lib/src/model/databinding/DataBinding.ts`
- UI shell and wiring: `packages/charts-lib/src/components/ChartWidget.vue`

## Lifecycle Phases
1. Construction
Create `Chart` and one or more `DataSource` instances. The chart sets up history, transaction manager, axes, sketchers, and pane state.
2. Pane Registration
`Chart.createPane` constructs pane options, assigns the data source transaction manager, applies incidents, and fires pane registration events.
3. UI Wiring
`ChartWidget` renders viewports and axes, wires interaction handlers, and listens for pane registration to manage shared UI state.
4. Data Binding
`DataBinding` subscribes to chart panes and data source events, maps content options to content keys, and updates entry content.
5. Interaction Loop
User interactions dispatch to `ChartUserInteractions`, update viewport selection and drag state, and trigger data source transactions.
6. History and Transactions
State mutations flow through `HistoricalTransactionManager` and incidents for undo/redo support.
7. Teardown
UI components remove listeners on unmount; data bindings should call `unbind` when no longer needed.

## Ownership and State
- Chart state and orchestration live in `model/chart` and `model/history`.
- Data source entry ownership and mutation live in `model/datasource`.
- Viewport interaction state (selection, highlighting, dragging) lives in `model/chart/viewport`.
- UI components translate input and render state but do not own domain rules.

## Common Debug Anchors
- Pane lifecycle events: `Chart.addPaneRegistrationEventListener` in `packages/charts-lib/src/model/chart/Chart.ts`
- Data source change events: `DataSource.addChangeEventListener` in `packages/charts-lib/src/model/datasource/DataSource.ts`
- Content updates: `DataBinding` in `packages/charts-lib/src/model/databinding/DataBinding.ts`

## Browser-free boundaries
- `packages/layout/src/model/pane-layout.ts` owns allocation and divider resize; Multipane measures/applies DOM sizes.
- `Chart.recordPaneResize` records already-applied dimensions with timed grouping. ChartWidget delegates its resize event.
- Historical protocols retain hooks for every participating source; each source flushes queued notifications after apply/inverse. Repeated registration is deduplicated.
- `History.clear` establishes a signed baseline and clears both directions without applying incidents.
- `tests/support/chartHarness.ts` owns its effect scope and pane listeners. Node integrations use real Chart/viewport/source objects; TESTING.md documents oracle limits.

- Chart owns a per-instance price scale registry and starts/stops each pane's VisiblePriceReference with registration. First-visible OHLCv close is derived without a renderer; see [price-scales.md](price-scales.md).
- Drawing persistence uses the shared `HasScale` contract: serialization stores a scale ID, and deserialization resolves all scale references before changing chart state, independently of the drawing type.
- Chart owns render and edit registries. Viewport gestures apply `DrawingBehavior` patches through the data source transaction; editing does not require a graphical cache. See [drawing-contracts.md](drawing-contracts.md).
