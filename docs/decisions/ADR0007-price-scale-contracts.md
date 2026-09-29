# ADR0007: Extend price scales across geometry, labels and persistence

Date: 2026-09-28. Status: accepted.

Updated: 2026-09-29 (grid uniformity and extreme-range numerical stability).

Zoom follow-up: keep the transformed grid pitch on discrete powers of sqrt(2), rounded up from the spacing budget. A continuously recomputed pitch preserved panning but rephased most labels on every wheel event even though the price under the cursor was mathematically fixed. Discrete density levels retain existing price levels between thresholds, preserving the 10% snapping tolerance and previous coverage bounds. Retain the fractional interval budget until pitch quantization to avoid sparse short panes. This is a pure range/count calculation; gesture caches and persistent grid state were rejected because they complicate undo, reloading and deterministic rendering. Repeated wheel tests and a native browser wheel test verify the cursor anchor and retained price levels.

## Problem and evidence

A body drag on differing drawing/axis scales used the new mouse X against the old line and snapped prices to the pointer. A horizontal drag changed 100 to 80 in the minimized Node regression. Fixed three-significant-digit rounding produced 17 identical captions in the range 100000..100001. Symmetric log arithmetic produced NaN coordinates around 1e-18. Scale selection was globally hard-coded in the menu and JSON discarded drawing scale functions.

## Decision

Retain separate interpolation and display scales. Body dragging translates a previous-position anchor in screen space and applies the resulting delta in the drawing's scale. Use log1p/expm1 for the existing symmetric-log transform.

Extend PriceAxisScale with optional raw-price tick generation and caption formatting. Supply a per-chart registry through ChartOptions.priceScales and pass it to each axis. Menus enumerate definitions; history/persistence select them by stable ID. Deserialization resolves definitions before state mutation. Existing regular/log IDs and string scale selection remain compatible.

Drawing persistence depends on the structural `HasScale` contract rather than the drawing type string. `Line` includes that contract; Channel/Spiral test data exercises the same serialization and hydration path. Export `HasScale`, `PriceScaleReference` and the `hasScale` guard through the existing public types entry point. A scale object with a string `id` declares a price-scale reference; scalar `scale` fields remain application data. A hard-coded list of drawing types was rejected because every new geometric drawing would otherwise require changes in both serializer and deserializer. Recursive traversal of arbitrary drawing payloads was rejected because nested fields need explicit semantics.

PriceLabelsInvalidator owns spacing, clipping and measurement, while scales own numeric ticks/formatting. Regular ticks use readable decimal steps. Log ticks round an evenly spaced transformed grid, anchored at zero: the target pitch is at least 1.5 times minimum label spacing, and decimal snapping may move each point by at most 10% of that pitch. Fixed 1/2/5 landmarks left only one label (500) in 300..800; independently rounded local intervals plus greedy thinning then produced gap ratios approaching 2. The uniform target grid preserves readable prices while bounding gap variation and avoiding collision thinning. Log captions preserve their tick values; regular/percentage precision recovers the nearest decimal step after subtracting nearby prices. A 0.01-pixel collision tolerance prevents numerical noise from removing valid ticks. HLine uses the same formatter. Cache measurements by caption/font/context with a 256-caption bound.

An extreme-range test (1e-298..1.0000001e-298 at 2000 pixels) exposed an overflowing projection multiplier. Keep cached multiplication for ordinary ranges, and normalize before multiplying when the cache is nonfinite. Apply the same fallback to batches, avoid inverse multiplier underflow, and calculate relative shifts/padding directly in normalized coordinates. The transform itself remains unchanged.

Percentage is a reference-dependent display scale. User-selected semantics: 0% comes from the first visible bar. Use its close in the pane's primary OHLCv source, including a partially visible bar. Derive the reference from model inputs/events, independent of rendering/history; unavailable/zero bases have no ticks. Keep all stored coordinates in raw prices.

## Scope and tradeoffs

Touches Chart/AddNewPane, PriceAxis and scale definitions, price label invalidation, Line/HLine sketchers, menu, serializer/deserializer and source invalidation. No new dependencies or model-to-component imports. Public additions: ChartOptions.priceScales, Chart.priceScales, axis availableScales/referencePrice/tickValues/formatPrice, exported scale context/function types and tick utilities.

A full plugin/service framework was rejected: definitions and optional functions are enough for regular, logarithmic, percentage and application-defined scales. Storing percentages as drawing coordinates was rejected because panning would mutate data and corrupt history. Renderer-derived percentage references were rejected because they would make Node behavior depend on rendering order.

This changes continuous drag and label hot paths. Drag does a constant number of transformations per endpoint; no renderer/worker round trip is introduced. Log generation caps the requested budget at 1000 and searches at most 17 significant digits with four decimal steps per target, independently of the number of price decades. This costs more than fixed landmarks or local packing but controls both density and uniformity. Projection tests multiplier finiteness once per batch and retains the ordinary cached multiplier. Reference lookup uses the primary source and scans drawing entries on relevant events, not OHLCv bars; bar selection uses the period index directly. No benchmark speedup is claimed. If large drawing counts make this lookup measurable, add a nonthrowing source lookup API rather than coupling to storage internals.

The reference extractor currently supports the existing OHLCv content model. Future series types need an explicit provider at that boundary. Custom transforms must define a valid finite monotone domain; no general automatic domain repair or transform-parameter editor is introduced. Definitions are configured before chart construction, not dynamically replaced while history is active.

See [price-scales.md](../architecture/price-scales.md) for behavior, extension example and test map.
