# Gate A Deliverable D6: Integration Bridge Adapter

Date: 2026-02-11
Status: Filled

## Objective
Define ownership, location, lifecycle, and test contract for temporary bridge adapters used in mixed migrated/non-migrated runtime.

## Location Decision
- Bridge adapters are module-local.
- PriceAxis bridge path (proposed): `frontend/packages/charts-lib/src/model/integration/bridges/price-axis/`.

## Ownership Decision
- Created by runtime bootstrap in `ChartWidget` composition root.
- Disposed by the same runtime during `onUnmounted`.
- Bridge must not self-register global listeners outside runtime ownership.

## Bridge Contract
- Subscribe to core domain events.
- Map events to legacy model update API.
- Trigger required legacy invalidators.
- Provide deterministic `dispose` that removes all subscriptions.

## Bridge Sketch
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

## Mixed Integration Test Example
This is a simplified sketch focused on event-to-legacy mapping verification.

```ts
test('PriceAxis bridge propagates scale change to legacy invalidation', () => {
  const core = createPriceAxisCoreForTest()
  const legacyAxis = createLegacyAxisModel()
  const invalidateSpy = vi.spyOn(legacyAxis, 'invalidateLabels')
  const updateSpy = vi.spyOn(legacyAxis, 'noHistoryManagedUpdate')

  const bridge = new VueLegacyBridgeForPriceAxis(core, legacyAxis)
  bridge.mount()

  core.setScale('log10')

  expect(invalidateSpy).toHaveBeenCalledTimes(1)
  expect(updateSpy).not.toHaveBeenCalledWith(expect.objectContaining({ range: undefined }))

  bridge.dispose()
})
```

## Duplication Control
- Temporary duplication must have TODO with owner and removal milestone.
- Policy: duplication TODO older than 2 sprints after module migration fails CI policy check.
