# Price scales and interaction contracts

## Coordinates, ticks, captions

A drawing stores raw prices. Its `Line.scale` defines interpolation: endpoints are linear in that scale's transformed coordinates. The price axis chooses the visible projection. These scales may differ; a straight semantic line then becomes a curve on screen.

`PriceAxisScale` is a stateless definition with a stable `id`, a menu `title`, and reversible `func.translate`/`func.revert`. Optional `ticks(range, count, context)` chooses raw price values; optional `format(value, step, context)` formats captions. Defaults use decimal steps 1, 2, 2.5, 5, 10. Functions must be finite, monotone and mutually inverse over the supported price domain. Scale IDs, not titles, identify persisted definitions. Two definitions may have the same title.

`PriceLabelsInvalidator` projects tick candidates, excludes clipped labels, sorts by screen position and removes collisions/duplicate captions. It measures every displayed caption when uncached; width is the maximum of those measurements. Its bounded caption cache resets when font or measurement context changes. Label precision follows the tick spacing, not the magnitude of the price. HLine marks use the axis formatter too.

The existing `log10` definition is a **symmetric logarithm**, not strict log10(price): sign(x) * log10(1 + abs(x)/C), C=1/ln(10). It supports zero and negative values. log1p/expm1 retain accuracy for very small prices. This behavior is preserved for existing charts.

Log ticks start from a uniform grid in transformed coordinates, anchored at zero. The desired pitch is at least 1.5 times the minimum label spacing, rounded up to discrete powers of sqrt(2). The fractional interval budget is retained until pitch selection so short panes do not lose density to double rounding. Pitch therefore stays fixed between density thresholds: a wheel event reprojects existing prices around the cursor instead of rephasing all ticks through a continuously changing span/intervals calculation. Crossing a threshold selects another density level; no gesture-dependent state or extra history is introduced.

Each grid point snaps to the coarsest readable decimal price within 10% of the selected pitch. Thus rounding can vary adjacent gaps between 80% and 120% of the target, without triggering collision thinning. This replaces independently rounded local grids, whose greedy thinning produced visibly alternating gaps. The zero anchor also preserves interior tick prices during panning at a fixed transformed span. Work is bounded by the label budget and 17 significant digits, independently of the number of price decades.

Log captions retain the chosen numeric value instead of applying one decimal precision to unequal local steps. Scientific formatting on regular/percentage scales derives significant digits from the tick step. Regular and percentage formatting recover the nearest decimal step after subtracting nearby prices, so floating-point cancellation cannot remove a required fractional digit. Collision filtering permits a 0.01-pixel tolerance to avoid discarding ticks that differ from the spacing threshold only through numerical error.

PriceAxis retains cached multiplication for normal projection, but normalizes by the transformed span first when the multiplier overflows on extremely small ranges. Batch projection uses the same fallback. Range padding and relative shifts operate directly on normalized coordinates; inverse projection avoids an underflowed cached multiplier. This preserves finite coordinates for the tested narrow ranges near 1e-298 without changing the scale transform.

The axis requests at least three candidate intervals when room for one label exists, so clipping both endpoints cannot empty a small panel. Node coverage tests check minimum density, maximum uncovered screen distance, non-overlap, clipping and numeric caption/position agreement. Panels smaller than three font heights intentionally have no labels.

## Drag semantics

DragMoveEvent deltas are previous minus current pointer coordinates. For a body drag, LineSketcher finds the grabbed price at the previous X, shifts that anchor in axis screen space, and applies its transformed-price delta to both endpoints in the drawing's scale. It preserves the drawing's slope in its own scale and its vertical grab offset. A horizontal drag changes only time coordinates. Different display/interpolation transforms may change the curve's screen shape; preserving its semantic slope is the contract. Endpoint handles move only their corresponding endpoint through the axis inverse.

Transforms are compared by function-object identity for the straight-path optimization, never by human-readable titles. Distinct but equivalent function objects safely use the general curve path.

## Built-in percentage scale

Select `axis.scale = 'percentage'` or `Scale - Percentage` in the price-axis menu. The base is the **close of the first visible OHLCv bar** in that pane's primary price series. A partially visible bar at the left boundary counts as visible. Set the pane's `priceAxis.primaryEntry` to the series drawing reference; sources may be shared.

Caption = (price - base) / abs(base) * 100. Geometry remains affine in raw prices. Panning changes the base; modifying a drawing does not rewrite its values into percentages. A zero/missing/nonfinite close or no visible data yields no percentage ticks and `—` for marks, rather than an invented base. Negative bases use the absolute denominator.

`VisiblePriceReference` observes the time range, primary source reference and source events. Chart starts/stops it on pane registration, including remove/undo. It works without a renderer. Its reference value is derived state, not a separate history entry or serialized field; scroll undo and refreshed data recompute it. Vue watcher updates settle on the next tick.

## Add a scale

Pass definitions when creating the chart. Defaults are merged with this per-chart registry; no global mutation or menu edits are needed.

```ts
import {
  Chart, type Price, type PriceAxisScale,
  linearPriceTicks, formatPriceNumber,
} from 'blackswan-charts';

const milliPrice: PriceAxisScale = {
  id: 'milli-price',
  title: 'Milli-price',
  func: {
    translate: (price: Price) => price * 1000,
    revert: (value: number) => value / 1000 as Price,
  },
  ticks: linearPriceTicks,
  format: (price, step) => `${formatPriceNumber(price * 1000, step * 1000)} mUSD`,
};
const chart = new Chart(undefined, { priceScales: { 'milli-price': milliPrice } });
// After creating a pane:
chart.paneModel('main').priceAxis.scale = 'milli-price';
```

Definitions should remain immutable after chart construction. The registry key must equal the definition ID. Dynamic reference-dependent formatting/ticks receive `context.referencePrice`; the built-in percentage scale is an example. The legacy `axis.fraction` getter remains available; new renderers should use `axis.formatPrice`.

Register the same ID when loading a saved chart. Axis selections and drawing interpolation scales persist by ID. Drawing data uses the public `HasScale` contract; `Line` implements it, and future channels or spirals can implement it without changing persistence. For example, `interface ChannelData extends HasScale { boundaries: number[][] }`. The default type parameter is the live `PriceAxisScale`; `HasScale<PriceScaleReference>` describes JSON data with only `{ id }`.

The shared `hasScale(data)` guard recognizes the structural field `data.scale.id`, independently of `drawing.type`, and accepts both live and serialized scale references. That field is reserved for a price-scale reference when it is an object with a string ID; unrelated scalar fields such as annotation `scale: 2` remain untouched. Serialization replaces only the scale definition, preserving the drawing payload. Deserialization resolves all referenced scales before modifying the chart and rejects unknown IDs. Legacy scale objects containing an ID are accepted; executable functions are never expected to survive JSON. The contract concerns one scale per drawing; it does not recursively interpret arbitrary nested fields.

## Tests

- `ScaleInteractions.spec.ts`: scale/inversion/handle combinations, grab offset, horizontal/diagonal drag, undo/redo, tiny log values and generated label ranges.
- `PriceLabelDensity.spec.ts`: coverage, gap uniformity, caption accuracy, resizing/collapse/reopen, inversion/pan stability, systematic magnitudes from 1e-300 to 1e300 and 1000 generated ranges/sizes/fonts across all three built-in scales. These are finite floating-point test domains, not a claim about unrepresentable ranges or arbitrary custom scales.
- `PriceAxis.spec.ts`: extreme-range projection/inverse, batch projection, relative shifts and padding for all built-in scales and both orientations.
- `PriceLabelZoom.spec.ts`: repeated cursor-centred zoom in/out, retained price levels between density thresholds, multiple cursor positions/ranges/orientations, and exact grid restoration after grouped undo/redo.
- `PercentageScale.spec.ts`: first-visible base, data refresh, scrolling, reattachment, per-chart registration, menu, JSON and history.
- `DrawingScalePersistence.spec.ts`: type-independent scale persistence using Channel/Spiral data, unchanged unrelated payloads, and atomic rejection of unknown scale IDs.
- `AxisTextMetrics.spec.ts`: layout using explicit metrics, style changes and undo.
- `ChartWidget.browser.spec.ts`: real pointer/hit-test integration on mixed scales and native price-axis wheel zoom without screenshots.
