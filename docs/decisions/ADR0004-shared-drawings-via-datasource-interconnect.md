# ADR0004: Shared Drawings Across Data Sources via Interconnect

## Context
Drawings use `DrawingReference` which can be a local id or `[DataSourceId, DrawingId]`. `DrawingOptions.shareWith` indicates sharing targets. `DataSourceSharedEntries` and `DataSourceInterconnect` propagate add/update/remove and data invalidation across data sources, and `Chart` registers data sources with the interconnect when panes are installed/uninstalled.

## Decision
The model supports shared drawings across panes by representing external references explicitly and propagating changes through `DataSourceInterconnect` and `DataSourceSharedEntries`.

## Rationale
Sharing drawings across panes enables overlays and annotations to stay synchronized without duplicating drawing logic per pane. (Assumption based on `shareWith` and interconnect propagation.)

## Alternatives considered
- Duplicate drawings in each data source and keep them in sync manually.
- Use a global drawing registry independent of data sources.
- Keep shared overlays entirely in the UI layer.

## Consequences
- Positive: Shared drawings are synchronized across panes with a single source of truth.
- Negative: Cross-data-source coupling introduces complexity and requires careful handling of external references and serialization.
