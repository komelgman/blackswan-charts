# DECISIONS.md

This log tracks trivial decisions recorded via inline `DECISION:` comments. Non-trivial decisions must be summarized in an ADR file and linked here.

## Entries

| Date (YYYY-MM-DD) | Type | Summary | Files | ADR |
| --- | --- | --- | --- | --- |
| 2026-02-06 | ADR | Model uses Vue reactivity and UI-layer types in core engine (legacy coupling). | frontend/packages/charts-lib/src/model/chart/Chart.ts; frontend/packages/charts-lib/src/model/type-defs/decorators/nonreactive-decorator.ts; frontend/packages/charts-lib/src/model/chart/viewport/layers/ViewportDataSourceLayer.ts | [ADR0001](ADR0001-model-uses-vue-and-ui-types.md) |
| 2026-02-06 | ADR | Incident-based history and transactions coordinate undo/redo and grouped mutations. | frontend/packages/charts-lib/src/model/history/History.ts; frontend/packages/charts-lib/src/model/history/HistoricalTransactionManager.ts; frontend/packages/charts-lib/src/model/datasource/DataSource.ts | [ADR0002](ADR0002-incident-based-history-transactions.md) |
| 2026-02-06 | ADR | Layered rendering uses worker offload and invalidation-driven redraws. | frontend/packages/charts-lib/src/model/chart/viewport/layers/ViewportGridLayer.ts; frontend/packages/charts-lib/src/model/chart/axis/layers/PriceAxisLabelsLayer.ts; frontend/packages/charts-lib/src/model/datasource/DataSourceInvalidator.ts | [ADR0003](ADR0003-layered-rendering-and-invalidation.md) |
| 2026-02-06 | ADR | Shared drawings propagate across data sources via external references and interconnect. | frontend/packages/charts-lib/src/model/datasource/DataSourceInterconnect.ts; frontend/packages/charts-lib/src/model/datasource/DataSourceSharedEntries.ts; frontend/packages/charts-lib/src/model/datasource/types/Drawing.ts | [ADR0004](ADR0004-shared-drawings-via-datasource-interconnect.md) |
| 2026-02-06 | ADR | Extract layout and layered-canvas into standalone packages with model-only dependencies. | frontend/packages/layout/src; frontend/packages/layered-canvas/src; frontend/packages/charts-lib/src/model | [ADR0005](ADR0005-extract-layout-and-layered-canvas-packages.md) |
| 2026-02-06 | ADR | Scope foundation utilities under `@blackswan/foundation` to keep package imports consistent. | frontend/packages/foundation/package.json; frontend/packages/charts-lib/package.json; frontend/packages/layout/package.json; frontend/packages/layered-canvas/package.json | [ADR0006](ADR0006-scope-foundation-package.md) |
| 2026-02-06 | Trivial | Serialization only includes internal drawings (string refs), so shared/external drawings are dropped on export. | frontend/packages/charts-lib/src/model/chart/serialization/ChartSerializer.ts | - |
| 2026-02-06 | Trivial | DataSource.reset removes only internal entries and resets IDs; shared external entries remain. | frontend/packages/charts-lib/src/model/datasource/DataSource.ts | - |
| 2026-02-06 | Trivial | DataBinding updates content without history and ignores shared events; content key drives shared subscriptions. | frontend/packages/charts-lib/src/model/databinding/DataBinding.ts | - |
