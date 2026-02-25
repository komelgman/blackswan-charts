# Framework-Agnostic Migration Plan (Draft v5, Ready for Gate A Preparation Phase)

Date: 2026-02-11
Status: Ready for Gate A preparation phase. POC coding is blocked until Gate A pass.

## 1. Scope and Goal
- Build a framework-agnostic core model for `charts-lib` and related model packages.
- Keep Vue as the only implemented UI adapter in MVP.
- Keep React adapter in design only (no implementation in MVP).
- Preserve existing behavior and public API during migration.

## 2. Decisions Frozen Before POC
These are fixed for Gate A and POC.

### 2.1 Event routing model
- Domain events are for non-hot-path state propagation.
- Hot-path rendering and hit-testing use direct calls plus coarse invalidation signals.
- No generic per-frame event-bus dispatch.

### 2.2 Event delivery semantics
- Typed in-process events per aggregate/module.
- Synchronous, in-order, at-most-once per emit.
- Emit with zero subscribers is a no-op.

### 2.3 Payload policy for high-volume events
- High-frequency datasource events use delta/change-mask payloads by default.
- Full previous/current snapshots are allowed only for low/medium frequency events.

### 2.4 Derived-state placement for axis
- Core owns canonical state, domain formulas, and domain-required memoized state.
- Vue adapter owns UI-only projections and Vue reactivity.
- No formula duplication across core and adapter.

### 2.5 PriceAxis cache invalidation pattern
- Use dirty flags inside core (`scaleCacheDirty`, `fractionDirty`, `projectionVersion`).
- Recompute lazily on read of `translate`, `revert`, and `fraction` accessors.
- Dirty flags are set only at deterministic mutation points.

### 2.6 History manager integration
- `PriceAxisCore` depends on a transaction port, not concrete `HistoricalTransactionManager`.
- Existing `HistoricalTransactionManager` is adapted via `HistoryTransactionPortAdapter`.

### 2.7 Adapter bootstrap ownership
- Bootstrap owner for MVP: `ChartWidget` composition root in `charts-lib`.
- Bootstrap is explicit one-time runtime wiring, not import side effects.

### 2.8 POC performance threshold
- Baseline must be measured before refactor.
- Regression budget for `PriceAxis` critical operations: max +10 percent on p95 wall time.
- No operation may exceed +2 ms absolute p95 increase when baseline p95 is under 20 ms.

## 3. Gate A Scope Mapping
Gate A is the approval point for all Pre-POC requirements. The lists are unified through the mapping below.

| Pre-POC Requirement | Gate A Deliverable | Verification Artifact |
| --- | --- | --- |
| Event template and critical events | D1 Event Routing Matrix | `docs/architecture/gate-a/event-routing-matrix.md` |
| PriceAxis boundary + cache strategy | D2 Cache Invalidation | `docs/architecture/gate-a/price-axis-cache-invalidation.md` |
| Baseline performance under protocol | D3 Benchmark Protocol + Baseline | `docs/architecture/gate-a/benchmark-protocol-and-baseline.md` |
| History transaction contract | D4 History Manager Decision | `docs/architecture/gate-a/history-transaction-port.md` |
| Bootstrap decision and call site | D5 Bootstrap Pattern Decision | `docs/architecture/gate-a/bootstrap-pattern.md` |
| Partial migration with bridge ownership | D6 Integration Bridge Adapter Sketch | `docs/architecture/gate-a/integration-bridge-adapter.md` |
| Dependency graph Level 0-2 | D4 and D6 references | `docs/architecture/gate-a/dependency-graph-level0-2.md` |
| Worker mapping ownership and paths | D4 and D6 references | `docs/architecture/gate-a/worker-boundary-and-mappers.md` |

### 3.1 Separate Gate A Files (Created in Previous Step)
- Canonical Gate A deliverables are maintained as separate files under `frontend/docs/architecture/gate-a/`.
- This migration plan is now the coordination index and approval checklist; detailed specs live in the files below.
- `frontend/docs/architecture/gate-a/event-routing-matrix.md` (`D1`, filled)
- `frontend/docs/architecture/gate-a/price-axis-cache-invalidation.md` (`D2`, filled)
- `frontend/docs/architecture/gate-a/benchmark-protocol-and-baseline.md` (`D3`, filled with measured baseline values)
- `frontend/docs/architecture/gate-a/history-transaction-port.md` (`D4`, filled)
- `frontend/docs/architecture/gate-a/bootstrap-pattern.md` (`D5`, filled)
- `frontend/docs/architecture/gate-a/integration-bridge-adapter.md` (`D6`, filled)
- `frontend/docs/architecture/gate-a/dependency-graph-level0-2.md` (supporting, filled)
- `frontend/docs/architecture/gate-a/worker-boundary-and-mappers.md` (supporting, filled)

## 4. Gate A Deliverables
Gate A passes only when all deliverables are present, reviewed, and linked from ADR.

### D1 Event Routing Matrix
What must be included:
- Minimum 12-15 core events.
- Routing strategy for each event: `event-bus`, `direct-call`, or `coarse-signal`.
- Frequency class and primary consumers.
- Explicit fallback behavior when no subscribers exist.

### D2 PriceAxis Cache Invalidation
What must be included:
- Chosen cache invalidation pattern with mutation points.
- Cascading invalidation example (`PriceAxisCore` -> dependent `ViewportCore` cache).
- Cleanup/dispose behavior for subscriptions and caches.

### D3 Benchmark Protocol and Baseline
What must be included:
- Measurement protocol with environment constraints.
- Baseline numbers from current Vue implementation.
- Operation set: `setRange`, `toggleInvert`, `setPrimaryEntry`, `clearPrimaryEntry`.
- Percentiles and run count definition.

### D4 History Manager Decision
What must be included:
- TypeScript transaction port interface code.
- Adapter contract from `HistoricalTransactionManager` to port.
- File path location for interface and adapter.

### D5 Bootstrap Pattern Decision
What must be included:
- Runtime bootstrap call-site pseudocode in `ChartWidget` composition root.
- Test harness bootstrap pseudocode for unit and integration tests.
- Explicit rule: no global import side effects.

### D6 Integration Bridge Adapter Sketch
What must be included:
- Bridge adapter location and ownership decision.
- Lifecycle ownership: who creates and who disposes bridge.
- One concrete mixed integration test example.

## 5. Event Specification Template
Every core event must define:
- `name`: stable event name.
- `owner`: aggregate/module that emits.
- `routing`: `event-bus`, `coarse-signal`, or `direct-call`.
- `trigger`: exact state transition that emits.
- `payload`: typed DTO schema and field semantics.
- `frequency`: expected volume class (`low`, `medium`, `high`).
- `consumers`: required and optional consumers.
- `no-consumer behavior`: explicit behavior when no one listens.
- `ordering and timing`: sync/async and ordering guarantees.

## 6. Event Routing Matrix (Expanded)

| Event | Routing | Frequency | Notes |
| --- | --- | --- | --- |
| `AxisRangeChanged` | `event-bus` | medium | Domain/state propagation. |
| `AxisScaleChanged` | `event-bus` | low | Triggers scale and labels refresh. |
| `AxisInvertedChanged` | `event-bus` | low | Coordinate inversion propagation. |
| `PrimaryEntryChanged` | `event-bus` | low | Auto/manual mode transitions. |
| `ViewportSelectionChanged` | `event-bus` | medium | Selection state updates outside frame loop. |
| `ViewportHighlightChanged` | `coarse-signal` | high | Highlight redraw request batched to frame boundary. |
| `ViewportDragStarted` | `event-bus` | medium | Transaction and interaction state start. |
| `ViewportDragged` | `direct-call` + `coarse-signal` | high | No per-frame generic event-bus dispatch. |
| `ViewportDragEnded` | `event-bus` | medium | Commit and cleanup. |
| `DataSourceEntryAdded` | `event-bus` + `coarse-signal` | medium | Delta payload; render invalidation batched. |
| `DataSourceEntryUpdated` | `event-bus` + `coarse-signal` | high | Change-mask payload only. |
| `DataSourceEntryRemoved` | `event-bus` + `coarse-signal` | medium | Selection/highlight cleanup plus redraw. |
| `DataSourceInvalidated` | `coarse-signal` | high | Render pipeline signal, no rich payload. |
| `ChartPaneAdded` | `event-bus` | low | Layout and datasource binding. |
| `ChartPaneRemoved` | `event-bus` | low | Teardown and unbinding. |

## 7. PriceAxis POC Boundary

### 7.1 `PriceAxisCore` owns
- Canonical state: `range`, `controlMode`, `scaleId`, `inverted`, `screenSize`, `primaryEntryRef`.
- Domain logic: range validation/normalization, move/zoom transforms, translate/revert math.
- Domain memoization: scaling params cache and fraction cache with dirty flags.
- Domain events: `AxisRangeChanged`, `AxisScaleChanged`, `AxisInvertedChanged`, `PrimaryEntryChanged`.
- Transaction usage via transaction port interface only.

### 7.2 `VuePriceAxisAdapter` owns
- Vue projection (`reactive`, `computed`, `watch`).
- Event-to-invalidation mapping.
- Adapter lifecycle (`mount`, `dispose`) and watcher cleanup.
- UI-only derivations (for example label widget width projection).

### 7.3 Not allowed in POC
- No duplicated transform formulas in adapter.
- No framework imports in `PriceAxisCore`.
- No per-frame generic event bus dispatch for rendering.

## 8. PriceAxis Cache Invalidation Pattern

### 8.1 Core dirty-flag pseudocode
```ts
class PriceAxisCore {
  private scaleCacheDirty = true
  private fractionDirty = true
  private projectionVersion = 0

  setRange(next: Range, reason: RangeChangeReason) {
    const prev = this.range
    this.range = normalizeRange(next)
    this.scaleCacheDirty = true
    this.fractionDirty = true
    this.projectionVersion++
    this.emitAxisRangeChanged(prev, this.range, reason, this.projectionVersion)
  }

  setScale(next: ScaleId) {
    if (next === this.scaleId) return
    this.scaleId = next
    this.scaleCacheDirty = true
    this.projectionVersion++
    this.emitAxisScaleChanged(this.projectionVersion)
  }

  translate(value: number): number {
    if (this.scaleCacheDirty) this.recomputeScaleCache()
    return this.applyProjection(value)
  }
}
```

### 8.2 Cascading invalidation pseudocode (`ViewportCore` dependent cache)
```ts
class ViewportCore {
  private axisProjectionVersion = -1
  private localProjectionCacheDirty = true
  private unsubs: Array<() => void> = []

  bind(axis: PriceAxisCore) {
    this.axisProjectionVersion = axis.getProjectionVersion()
    this.unsubs.push(axis.onAxisRangeChanged((e) => this.onAxisProjectionChanged(e.projectionVersion)))
    this.unsubs.push(axis.onAxisScaleChanged((e) => this.onAxisProjectionChanged(e.projectionVersion)))
    this.unsubs.push(axis.onAxisInvertedChanged((e) => this.onAxisProjectionChanged(e.projectionVersion)))
  }

  private onAxisProjectionChanged(nextVersion: number) {
    if (nextVersion !== this.axisProjectionVersion) {
      this.axisProjectionVersion = nextVersion
      this.localProjectionCacheDirty = true
      this.emitViewportInvalidated('projection')
    }
  }

  dispose() {
    for (const unsub of this.unsubs) unsub()
    this.unsubs.length = 0
    this.localProjectionCacheDirty = true
  }
}
```

## 9. History Transaction Port Contract

### 9.1 Port interface
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

### 9.2 Adapter location
- Port interface location (planned): `frontend/packages/charts-lib/src/model/core/ports/TransactionPort.ts`.
- Adapter location (planned): `frontend/packages/charts-lib/src/model/integration/history/HistoryTransactionPortAdapter.ts`.

## 10. Bootstrap Pattern

### 10.1 Runtime bootstrap call site (pseudocode)
```ts
// ChartWidget composition root
onMounted(() => {
  const transactionPort = new HistoryTransactionPortAdapter(props.chart.transactionManager)
  const runtime = createChartRuntime({
    transactionPort,
    bridgeFactory: createVueLegacyBridgeFactory(),
  })

  runtime.mount(props.chart)
  teardown = () => runtime.dispose()
})

onUnmounted(() => {
  teardown?.()
})
```

### 10.2 Test harness bootstrap (pseudocode)
```ts
export function createTestRuntime(chart: Chart) {
  const transactionPort = new HistoryTransactionPortAdapter(chart.transactionManager)
  const runtime = createChartRuntime({
    transactionPort,
    bridgeFactory: createNoopBridgeFactory(),
  })
  runtime.mount(chart)
  return runtime
}
```

## 11. Benchmark Protocol and Baseline

### 11.1 Environment rules
- Run in production build mode.
- Disable browser devtools during measurement.
- Use fixed dataset and deterministic random seed.
- Run baseline and candidate on the same machine profile.

### 11.2 Measurement rules
- Warmup iterations: 200.
- Measured iterations: 2000.
- Repeat full run 5 times.
- Report median-of-runs for p50, p95, p99.
- Capture allocation proxy: `performance.memory.usedJSHeapSize` delta where supported.

### 11.3 Baseline operation set
- `setRange`.
- `toggleInvert`.
- `setPrimaryEntry`.
- `clearPrimaryEntry`.

### 11.4 Baseline reference table (must be filled in Gate A)

| Operation | p50 (ms) | p95 (ms) | p99 (ms) | Heap delta (bytes) | Notes |
| --- | --- | --- | --- | --- | --- |
| `setRange` | TBD | TBD | TBD | TBD | current Vue implementation |
| `toggleInvert` | TBD | TBD | TBD | TBD | current Vue implementation |
| `setPrimaryEntry` | TBD | TBD | TBD | TBD | current Vue implementation |
| `clearPrimaryEntry` | TBD | TBD | TBD | TBD | current Vue implementation |

## 12. Worker Boundary and Integration Layer Location
- Integration layer locations for MVP (planned):
  - `frontend/packages/charts-lib/src/model/chart/axis/layers/integration/`
  - `frontend/packages/charts-lib/src/model/chart/viewport/layers/integration/`
  - `frontend/packages/charts-lib/src/model/workers/dto-mappers/`
- Mapping ownership: integration modules adjacent to render layers.
- Mapping trigger: coarse invalidation signals or explicit render requests.
- Core events are not forwarded to workers by default.
- Debug forwarding is optional, opt-in, and throttled.

## 13. Partial Migration and Bridge Adapter

### 13.1 Bridge location and ownership decision
- Bridge adapters are module-local, not centralized.
- PriceAxis bridge path (planned): `frontend/packages/charts-lib/src/model/integration/bridges/price-axis/`.
- Ownership:
  - Created by runtime bootstrap in `ChartWidget` composition root.
  - Disposed by the same runtime on `onUnmounted`.

### 13.2 Temporary bridge adapter sketch
```ts
class VueLegacyBridgeForPriceAxis {
  private unsubs: Array<() => void> = []

  constructor(private core: PriceAxisCore, private legacyAxis: PriceAxisVueModel) {}

  mount() {
    this.unsubs.push(
      this.core.onAxisRangeChanged((e) => {
        this.legacyAxis.noHistoryManagedUpdate({ range: e.current })
        this.legacyAxisInvalidateLabels()
      }),
    )

    this.unsubs.push(
      this.core.onAxisScaleChanged(() => {
        this.legacyAxisInvalidateLabels()
      }),
    )
  }

  dispose() {
    for (const unsub of this.unsubs) unsub()
    this.unsubs.length = 0
  }
}
```

### 13.3 Mixed integration test example (pseudocode)
```ts
test('PriceAxisCore updates legacy labels through bridge', () => {
  const legacyAxis = createLegacyAxisModel()
  const core = createPriceAxisCoreForTest()
  const bridge = new VueLegacyBridgeForPriceAxis(core, legacyAxis)
  bridge.mount()

  core.setScale('log10')

  expect(legacyAxis.labels.value.length).toBeGreaterThan(0)

  bridge.dispose()
})
```

### 13.4 Duplication control
- Temporary duplication requires a tracked TODO with owner and removal milestone.
- If TODO survives beyond 2 sprints after module migration, CI fails on policy check.

## 14. Dependency Graph (Level 0-2)

### Level 0
- `foundation`: no UI dependency.
- `context-menu/types`: depends on `foundation` only.
- `layered-canvas/model`: depends on internal model types only.

### Level 1
- `PrimaryEntry`: datasource entry refs and local state only.
- datasource helper modules: datasource types/events + `foundation` utilities.

### Level 2
- `Axis`: axis types/incidents, transaction port, `PrimaryEntry`.
- `PriceAxis`: `Axis`, scale definitions, axis incidents, transaction port.
- `PriceLabelsInvalidator`: `PriceAxis` + render context + label cache.

Migration rule:
- Move dependencies bottom-up. `PriceAxisCore` extraction defines explicit ports for non-core dependencies.

## 15. Revised Implementation Phases
Phase 0: Guardrails and ADR
- Add lint rule: disallow `from 'vue'` in `packages/**/src/model/**` and `packages/**/src/types/**`.
- Add lint rule: disallow deep imports `blackswan-charts/*` in `apps/**`.
- Add ADR: `Event-driven core + Vue adapter MVP + React adapter planned`.

Phase 1: Low-risk cleanup
- `foundation`: remove direct Vue import from `NonReactive` implementation.
- `context-menu/types`: replace Vue `CSSProperties` with framework-neutral style type.
- `context-menu`: move `ContextMenuDirective` from model area to Vue adapter/component area.
- `layered-canvas/model`: remove Vue `WatchStopHandle` type from model surface.

Gate A: all deliverables in section 4 complete and approved
Gate B: `PriceAxis` POC passes parity and performance thresholds

Phase 2: Axis core extraction
Phase 3: Viewport and datasource interaction extraction
Phase 4: Rendering/invalidation integration with hot-path constraints
Phase 5: Chart orchestration migration
Gate C: end-to-end parity and performance acceptance
Phase 6: React adapter design document finalization (no code)

## 16. Validation Checklist
- `rg "from 'vue'" packages/**/src/model` is zero for migrated modules.
- `rg "CSSProperties" packages/**/src/types` is zero.
- No `blackswan-charts/*` deep imports from `apps/**`.
- Unit tests and integration tests pass for migrated modules.
- Demo app behavior parity verified.
- Performance checks for hot paths are within accepted thresholds.

## 17. Remaining Open Questions (Non-Blocking)
- Should optional debug event tracing be persisted to logs or only exposed in devtools hooks?
- Should debug worker forwarding use sampled mode by default in development?

## 18. Explicit Do-Not-Do
- Do not start broad Phase 2/3 migration before Gate A and Gate B.
- Do not add framework-agnostic fake reactivity abstractions in MVP.
- Do not run big-bang rewrite across all model modules.
- Do not route per-frame render loop through generic event bus.
