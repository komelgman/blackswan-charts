# ADR0008: Separate drawing edits from rendering and exercise the API through a gallery

## Context

Sketchers accepted an entire viewport, combined geometry, render cache maintenance, menu contracts and drag callbacks, and mutated data sources. New compound drawings would amplify these dependencies. The demo was one random timed script rather than reproducible examples of the public API.

## Decision

- Restrict sketchers to display invalidation and style, supplied through `DrawingProjection`; remove drag/menu methods.
- Register pure `DrawingBehavior` functions separately. `Viewport` remains the gesture/transaction owner and applies returned patches through the existing data source and incidents.
- Extract line clipping and sampling without changing their algorithms. Reuse them for `Channel`, alongside independent channel editing. Keep persistence generic through `HasScale`.
- Instantiate built-in sketchers for each chart instead of sharing mutable styled singletons.
- Replace the demo with a gallery using only public library exports. Each executable example module is also its displayed source (`?raw`). Fixed synthetic data, hash routes and a reset via component remount keep examples reproducible without a backend or router dependency.
- Export `blackswan-charts/style.css` for packaged consumers; the demo imports it in production, while Vite injects SFC styles in development.

## Alternatives

A complete engine rewrite or immediate removal of Vue would combine unrelated risks. Merely splitting large sketcher files would leave source mutations and orchestration access intact. A generic drawing/plugin framework was not introduced: separate existing render/edit registrations are enough to validate a second composed shape. Screenshot comparisons were rejected for functional validation; the gallery complements independent model tests.

## Evidence and trade-offs

Existing line drag, projection, generated history and browser adapter tests are retained. New tests edit channels without constructing graphics, exercise axis/drawing scale combinations and arbitrary registration keys, and round-trip scale references. Gallery browser checks cover bounded canvas dimensions in the packaged build, routes, source files, actions, native channel handles and mobile overflow.

Drawing projection facades are allocated once per viewport. Render caches and graphical objects continue to be reused; extracted line projection returns small coordinate arrays, with existing sampling bounds unchanged. This is a bounded hot-path trade-off for shared geometry, not a claim of measured performance improvement.

Custom sketchers must migrate their drag callbacks to `ChartOptions.drawingBehaviors`; see [drawing-contracts.md](../architecture/drawing-contracts.md). New exports include projection/edit contracts, line edit functions, `Channel`, `moveChannel` and `ChannelSketcher`. The CSS subpath is additive. Generic history and serialization need no channel-specific branch.

## Follow-up boundaries

Moving graphical caches out of data sources, separating OHLCv auto-range policy, and eliminating engine Vue coupling remain independent decisions. The gallery provides concrete consumers for evaluating those changes.
