# ADR0003: Layered Rendering With Invalidation and Worker Offload

## Context
Rendering uses layered-canvas render layers in model code. Grid and axis label layers extend `WorkerRenderLayer` and render via Web Workers; data source and highlighting layers extend `DirectRenderLayer` and draw on the main thread. Invalidation is driven by `DataSourceInvalidator` and axis label invalidators, using `descriptor.valid` and change events to re-sketch entries and mark layers invalid.

## Decision
The chart rendering pipeline is decomposed into layered render layers, with worker-based rendering for grid and axis labels and direct rendering for data source drawings/highlighting. Rendering is invalidation-driven: caches on entries and axis labels are refreshed only when inputs change.

## Rationale
Separating layers and offloading heavy text/grid rendering reduces main-thread work on hot paths. Invalidation avoids full re-renders and limits work to changed layers or entries. (Assumption based on explicit worker layers and invalidators.)

## Alternatives considered
- Single canvas render pass for all elements every frame.
- Full re-render on any change without entry-level caching.
- Render all layers in a worker and blit to the main thread.

## Consequences
- Positive: Reduced main-thread load and targeted redraws on hot paths.
- Negative: Requires layered-canvas infrastructure, worker messaging, and cache/invalidator coordination; increases model-to-UI coupling.
