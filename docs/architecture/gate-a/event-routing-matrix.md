# Gate A Deliverable D1: Event Routing Matrix

Date: 2026-02-11
Status: Filled

## Objective
Define routing strategy, payload shape, frequency, and consumer contract for core events used in the migration POC and immediate follow-up phases.

## Routing Rules
- `event-bus`: synchronous typed domain event for non-frame orchestration.
- `coarse-signal`: low-payload invalidation signal consumed by render integration.
- `direct-call`: hot-path operation invocation without generic bus fanout.

## Matrix

| Event | Owner | Trigger | Routing | Frequency | Payload Shape | Required Consumers | No-Consumer Behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `AxisRangeChanged` | `AxisCore` | range committed after validation | `event-bus` | medium | `{ axisId, previous, current, reason, projectionVersion }` | axis invalidation coordinator | core state remains valid |
| `AxisScaleChanged` | `PriceAxisCore` | scale committed | `event-bus` | low | `{ axisId, previousScaleId, currentScaleId, projectionVersion }` | axis labels invalidator | core state remains valid |
| `AxisInvertedChanged` | `PriceAxisCore` | inverted flag committed | `event-bus` | low | `{ axisId, inverted, projectionVersion }` | viewport projection invalidator | core state remains valid |
| `PrimaryEntryChanged` | `AxisCore` | primary entry set/cleared | `event-bus` | low | `{ axisId, previousRef, currentRef, controlModeAfter }` | auto-range coordinator | core state remains valid |
| `ViewportSelectionChanged` | `ViewportCore` | selected set changes | `event-bus` | medium | `{ viewportId, selectedRefs, mode }` | selection overlay invalidator | selection state not propagated to UI |
| `ViewportHighlightChanged` | `ViewportCore` | highlight target changes | `coarse-signal` | high | `{ viewportId, reason: 'pointer-move' | 'drag' }` | highlight layer invalidator | next frame may keep stale highlight |
| `ViewportDragStarted` | `ViewportCore` | drag start accepted | `event-bus` | medium | `{ viewportId, dragMode, pointer }` | transaction coordinator | drag side-effects not started |
| `ViewportDragged` | `ViewportCore` | drag delta applied | `direct-call` + `coarse-signal` | high | direct args: `(dx, dy)`; signal: `{ viewportId, reason: 'drag-step' }` | render invalidation scheduler | no redraw if scheduler disconnected |
| `ViewportDragEnded` | `ViewportCore` | drag finished | `event-bus` | medium | `{ viewportId, dragMode, committed }` | transaction coordinator | transaction may remain open |
| `DataSourceEntryAdded` | `DataSourceCore` | entry committed | `event-bus` + `coarse-signal` | medium | `{ dataSourceId, entryRef, changeMask, shared }` | datasource layer invalidator | redraw not requested |
| `DataSourceEntryUpdated` | `DataSourceCore` | entry mutation committed | `event-bus` + `coarse-signal` | high | `{ dataSourceId, entryRef, changeMask, shared }` | datasource layer invalidator | redraw not requested |
| `DataSourceEntryRemoved` | `DataSourceCore` | entry removed | `event-bus` + `coarse-signal` | medium | `{ dataSourceId, entryRef, shared }` | selection/highlight cleanup coordinator | stale selection/highlight possible |
| `DataSourceInvalidated` | `DataSourceCore` | bulk invalidation requested | `coarse-signal` | high | `{ dataSourceId, reason }` | render scheduler | stale layer until next explicit refresh |
| `ChartPaneAdded` | `ChartCore` | pane committed | `event-bus` | low | `{ chartId, paneId, index, dataSourceId }` | layout binder, datasource interconnect binder | pane core exists but UI not mounted |
| `ChartPaneRemoved` | `ChartCore` | pane removed | `event-bus` | low | `{ chartId, paneId, index }` | layout unbinder, datasource interconnect unbinder | removed pane may remain mounted |

## Operational Notes
- High-frequency datasource events must keep delta payload only.
- `ViewportDragged` is explicitly excluded from generic bus fanout.
- `projectionVersion` is part of axis projection-change events and is consumed by dependent caches.
