# Gate A Deliverable D2: PriceAxis Cache Invalidation

Date: 2026-02-11
Status: Filled

## Objective
Specify deterministic cache invalidation for `PriceAxisCore` and cascading invalidation for dependent core modules (`ViewportCore`).

## Invariants
- `scaleCache` is valid iff `scaleCacheDirty === false`.
- `fractionValue` is valid iff `fractionDirty === false`.
- `projectionVersion` increments exactly when projection-affecting state changes.
- Projection-affecting state: `range`, `scaleId`, `inverted`, `screenSize.main`.

## Mutation Points and Effects

| Mutation | scaleCacheDirty | fractionDirty | projectionVersion increment | Event |
| --- | --- | --- | --- | --- |
| `setRange` | true | true | yes | `AxisRangeChanged` |
| `setScale` | true | false | yes | `AxisScaleChanged` |
| `setInverted` | false | false | yes | `AxisInvertedChanged` |
| `setScreenSizeMain` | true | false | yes | no domain event, adapter signal allowed |
| `setPrimaryEntryRef` | false | false | no | `PrimaryEntryChanged` |

## Core Pattern (Chosen)
```ts
class PriceAxisCore {
  private scaleCacheDirty = true
  private fractionDirty = true
  private projectionVersion = 0

  setRange(next: Range, reason: RangeChangeReason) {
    const previous = this.range
    this.range = normalizeRange(next)
    this.scaleCacheDirty = true
    this.fractionDirty = true
    this.projectionVersion++
    this.emitAxisRangeChanged({
      axisId: this.id,
      previous,
      current: this.range,
      reason,
      projectionVersion: this.projectionVersion,
    })
  }

  translate(value: number): number {
    if (this.scaleCacheDirty) this.recomputeScaleCache()
    return this.project(value)
  }

  getFraction(): number {
    if (this.fractionDirty) {
      this.fractionValue = computeFraction(this.range)
      this.fractionDirty = false
    }
    return this.fractionValue
  }
}
```

## Cascading Invalidation (`ViewportCore`)
```ts
class ViewportCore {
  private axisProjectionVersion = -1
  private localProjectionCacheDirty = true
  private unsubs: Array<() => void> = []

  bind(axis: PriceAxisCore) {
    this.axisProjectionVersion = axis.getProjectionVersion()
    this.unsubs.push(axis.onAxisRangeChanged((e) => this.onProjectionChanged(e.projectionVersion)))
    this.unsubs.push(axis.onAxisScaleChanged((e) => this.onProjectionChanged(e.projectionVersion)))
    this.unsubs.push(axis.onAxisInvertedChanged((e) => this.onProjectionChanged(e.projectionVersion)))
  }

  private onProjectionChanged(version: number) {
    if (version !== this.axisProjectionVersion) {
      this.axisProjectionVersion = version
      this.localProjectionCacheDirty = true
      this.emitViewportInvalidated({ reason: 'projection' })
    }
  }

  dispose() {
    for (const unsub of this.unsubs) unsub()
    this.unsubs.length = 0
    this.localProjectionCacheDirty = true
  }
}
```

## Cleanup Rules
- Any module that subscribes to axis events must own and dispose unsubscribe handlers.
- Disposing a module invalidates local caches to avoid stale reuse after remount.
- No cache survives beyond owner lifecycle by default.
