# Gate A Deliverable D5: Bootstrap Pattern

Date: 2026-02-11
Status: Filled

## Objective
Define explicit runtime bootstrap (no import side effects) and test harness bootstrap for migration runtime components.

## Rule
- Bootstrap must be explicit and initiated by composition root.
- No runtime wiring on module import.

## `ChartRuntime` Contract
```ts
export interface ChartRuntime {
  mount(chart: Chart): void
  dispose(): void
}
```

Responsibilities:
- Build and own adapters/bridges for migrated modules.
- Wire core ports to legacy services (`TransactionPort`, bridges, invalidation schedulers).
- Own lifecycle and cleanup of all subscriptions and bridges.

Non-responsibilities:
- Rendering UI.
- Domain computations (owned by core).

## Runtime Bootstrap Call Site
```ts
// ChartWidget composition root
let runtime: ChartRuntime | undefined

onMounted(() => {
  const transactionPort = new HistoryTransactionPortAdapter(props.chart.transactionManager)
  runtime = createChartRuntime({
    transactionPort,
    bridgeFactory: createVueLegacyBridgeFactory(),
  })
  runtime.mount(props.chart)
})

onUnmounted(() => {
  runtime?.dispose()
  runtime = undefined
})
```

## Test Harness Bootstrap
```ts
export function createTestRuntime(chart: Chart): ChartRuntime {
  const transactionPort = new HistoryTransactionPortAdapter(chart.transactionManager)
  const runtime = createChartRuntime({
    transactionPort,
    bridgeFactory: createNoopBridgeFactory(),
  })
  runtime.mount(chart)
  return runtime
}
```

## Ownership
- Runtime owner in production: `ChartWidget` composition root.
- Runtime owner in tests: test harness factory.
- Owner that calls `mount` must always call `dispose`.

## Proposed Location
- `frontend/packages/charts-lib/src/model/integration/runtime/ChartRuntime.ts` (proposed).
