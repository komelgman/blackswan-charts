# Engine Lifecycle Map

This is a map of the chart engine lifecycle. It is not a tutorial.

## Primary Entry Points
- Public API exports: `frontend/packages/charts-lib/src/index.ts`
- Engine orchestrator: `frontend/packages/charts-lib/src/model/chart/Chart.ts`
- Data source model: `frontend/packages/charts-lib/src/model/datasource/DataSource.ts`
- Data binding: `frontend/packages/charts-lib/src/model/databinding/DataBinding.ts`
- UI shell and wiring: `frontend/packages/charts-lib/src/components/chart/ChartWidget.vue`

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
- Pane lifecycle events: `Chart.addPaneRegistrationEventListener` in `frontend/packages/charts-lib/src/model/chart/Chart.ts`
- Data source change events: `DataSource.addChangeEventListener` in `frontend/packages/charts-lib/src/model/datasource/DataSource.ts`
- Content updates: `DataBinding` in `frontend/packages/charts-lib/src/model/databinding/DataBinding.ts`
