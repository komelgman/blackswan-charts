# ADR0002: Incident-Based History and Transactions

## Context
`History`, `HistoricalProtocol`, and `HistoricalTransactionManager` implement undo/redo and transaction grouping. Core mutations in `Chart`, `Axis`, and `DataSource` execute `HistoricalIncident`s via the transaction manager. Protocols can merge incidents and can be rejected if empty.

## Decision
All state-changing operations in the model are executed as incidents grouped into historical protocols via a transaction manager. Undo/redo is implemented by applying or inverting protocols, and transactions can be nested and grouped by protocol title/timeouts.

## Rationale
This structure centralizes state changes, enabling consistent undo/redo and grouping of user actions while allowing incident merging to avoid noisy history entries. (Assumption based on protocol titles, timeouts, and merge behavior.)

## Alternatives considered
- Snapshot-based history of model state.
- Event sourcing at the data-source level without explicit incidents.
- Rely on Vue reactivity and manual history capture.

## Consequences
- Positive: Undo/redo and grouping are consistent across chart, axes, and data sources.
- Negative: All mutations must route through the transaction manager or no-history paths, increasing complexity and coupling to the incident system.
