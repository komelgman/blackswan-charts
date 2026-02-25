# Gate A Deliverable D4: History Transaction Port

Date: 2026-02-11
Status: Filled

## Objective
Define semantic contract for transaction coordination and adapter mapping from existing `HistoricalTransactionManager`.

## Contract Semantics

### `open(options)`
- Starts or nests a transaction scope.
- Must be idempotent only by caller discipline (no duplicate-open guard implied).
- When nested, the outermost scope owns final signing behavior.

### `execute(report)`
- Records one transaction step in current open scope.
- Must fail if no scope is open.
- `report.incident` must be deterministic and serializable by history subsystem policy.
- `lifeHooks` are imperative callbacks executed by history engine lifecycle and are not domain events.

### `close(options)`
- Closes one scope level.
- Returns `true` only when outermost scope is fully closed.
- `signOnClose` controls whether closure emits/signs terminal marker.

### `transact(report, options)`
- Convenience API equivalent to `open -> execute -> close` with option propagation.
- Must preserve ordering and atomicity guarantees of explicit sequence.

## Invariants
- No `execute` without open scope.
- Close depth must never underflow.
- Incident ordering is preserved within one transaction scope.
- Lifecycle hooks must run in deterministic order relative to incident application/inversion.

## TypeScript Port Interface
```ts
export interface TransactionPort {
  open(options?: { protocolTitle?: string; timeout?: number }): void
  execute(report: {
    incident?: unknown
    lifeHooks?: {
      afterApply?: () => void
      afterInverse?: () => void
      beforeApply?: () => void
      beforeInverse?: () => void
    }
    immediate?: boolean
    skipIf?: (incident: unknown) => boolean
    sign?: boolean
  }): void
  close(options?: { signOnClose?: boolean }): boolean
  transact(
    report: {
      protocolOptions?: { protocolTitle?: string; timeout?: number }
      incident?: unknown
      lifeHooks?: {
        afterApply?: () => void
        afterInverse?: () => void
        beforeApply?: () => void
        beforeInverse?: () => void
      }
      immediate?: boolean
      skipIf?: (incident: unknown) => boolean
      sign?: boolean
    },
    options?: { propagate?: boolean; signOnClose?: boolean },
  ): void
}
```

## Adapter Mapping
- Existing manager methods:
  - `openTransaction` -> `open`
  - `exeucteInTransaction` -> `execute`
  - `tryCloseTransaction` -> `close`
  - `transact` -> `transact`
- Existing manager file inspected: `frontend/packages/charts-lib/src/model/history/HistoricalTransactionManager.ts`.
- Current manager has no direct Vue imports; integration concern is decoupling core from concrete class.

## Proposed Locations
- Port interface: `frontend/packages/charts-lib/src/model/core/ports/TransactionPort.ts`.
- Adapter: `frontend/packages/charts-lib/src/model/integration/history/HistoryTransactionPortAdapter.ts`.

## Path Validation (Current Codebase)
- `frontend/packages/charts-lib/src/model/core/ports` does not exist yet.
- `frontend/packages/charts-lib/src/model/integration` does not exist yet.
- Both are proposed paths to be created in Phase 1/POC prep.
