# Drawing contracts

## Flow and ownership

1. Browser adapters translate pointer input to viewport gestures.
2. `Viewport` owns selection, cloning and the drag transaction. It looks up a `DrawingBehavior` by drawing type, supplies current data and projection, and applies the returned data patch through `DataSource.update`.
3. Geometry and edit functions under `packages/charts-lib/src/model/chart/drawing` do not know about data sources, history, menus or Vue. `DrawingDrag` contains only coordinates and previous-minus-current screen deltas.
4. `DrawingProjection` exposes current axis conversions and display policy through a facade created once per viewport. It has no source or history access and no axis mutation methods. Live getters preserve updates during pan, zoom and inversion.
5. `DataSourceInvalidator` invokes a sketcher with the entry and projection. A sketcher updates visibility, graphics, handles and marks; it does not change persistent drawing options.
6. Graphics draw and hit-test the same projected paths. Existing layers own canvas/worker lifetime and invalidation.

`Line` clipping and curve sampling are shared geometry/projection functions. `LineSketcher` updates graphical caches and endpoint handles. `HLine` and `VLine` retain their small projection/mark routines, with editing in separate functions. The OHLCv content-request stub was removed: it always returned an empty update and performed no loading. Live feeds remain the responsibility of `DataBinding` and providers.

## Registering an extension

Both registrations use the same arbitrary drawing type key:

```ts
import { Chart, ChannelSketcher, moveChannel } from 'blackswan-charts';

const chart = new Chart(undefined, {
  sketchers: new Map([['ParallelBand', new ChannelSketcher()]]),
  drawingBehaviors: new Map([['ParallelBand', moveChannel]]),
});
```

A sketcher needs only `invalidate(entry, projection)` and `setChartStyle(style)`. A behavior receives `(data, projection, drag, handleId)` and returns a partial data update or `undefined` for an unsupported handle. It must not mutate its inputs. No drawing-type branches are needed in the viewport, history or persistence. A drawing without an editing behavior remains renderable but cannot be dragged. Each chart owns fresh built-in sketchers, so mutable styles are not shared between chart instances; callers own custom sketcher instances.

### Migration from the previous Sketcher API

- Move `dragHandle` logic into a registered `DrawingBehavior`; return the data patch instead of calling `dataSource.update`.
- Replace `Viewport` arguments in drawing code with `DrawingProjection` and use only its read-only conversions/display policy.
- Remove `contextmenu` from sketchers. The former empty hook is no longer part of the drawing contract; menus belong to the user-interaction adapter.
- Keep `ChartOptions.sketchers` for render registrations. Use `ChartOptions.drawingBehaviors` for edits. This is a public contract change for custom sketchers.

## Channel

`Channel` combines the existing line definition/scale/style with a signed `offset` in the drawing scale's transformed price units. Its second boundary adds this offset to both endpoint prices in that scale. It shares line clipping, curve sampling and graphics with `Line`.

The channel has two endpoint handles and a width handle at the second boundary's midpoint. Body dragging chooses the grabbed boundary in screen space, preserving its pointer offset even when axis and drawing scales differ. Width edits preserve the baseline, and endpoint edits preserve the offset. The current channel describes parallel price functions of time; vertical/coincident-time baselines are degenerate, not a perpendicular-distance channel tool. Fill and additional channel variants are outside this first extension.

Scale serialization uses `HasScale`, so `Channel` needs no serializer/deserializer type branch. Its changes use the existing incidents, source ownership and undo/redo machinery.

## Validation and remaining boundaries

- `DrawingBehavior.spec.ts`: editing without graphics/Path2D, mixed scales and inversion, either channel boundary, handles, input preservation, custom type registration, JSON restore.
- Existing scale/history/render suites preserve the earlier line behavior and shared-source semantics.
- Browser tests retain native hit testing and add channel handle editing in the gallery.
- ESLint prevents drawing geometry/sketchers from importing viewport/source/history orchestration or menu contracts.

Graphical caches still live in `DataSourceEntry`; moving them to viewport-owned storage is a separate migration, especially for shared drawings. Vue reactivity remains in engine orchestration, and OHLCv preferred-range calculation remains in its sketcher. This change separates editing from projection/rendering without replacing the entire engine.

## Open questions after the channel extension

These are follow-up design questions, not accepted API changes or confirmed defects. The channel demonstrates extension through shared geometry and separate render/edit registrations without controller, history or persistence branches. Because it composes two existing lines, it does not establish that arbitrary curves, rotation or multi-step creation already fit the editing contract.

### 1. Retain the picked part throughout a gesture

`Graphics.hitTest` returns a boolean, and the viewport tracks an entry and an optional handle. Channel body editing consequently determines the nearest boundary again on each update.

- Should picking return the drawing reference, part ID and optional handle ID, with the grabbed part retained until the gesture ends?
- How should overlapping parts, handles and drawings be prioritized, including shared drawings?
- Validate the design with dragging either channel boundary across the other, mixed/inverted scales and undo/redo. The initially grabbed part must remain stable throughout the gesture.

### 2. Give editing an explicit session

`DrawingBehavior` receives current data and incremental screen deltas. There is no behavior-level lifecycle or captured initial geometry for a complete gesture.

- What belongs in begin/update/commit/cancel, and who owns the initial data, projection snapshot, modifiers and snapping state?
- How should cancellation, selection/source removal and multi-object edits interact with the viewport's existing transaction ownership?
- Validate cancellation restoring the initial state without a committed history entry, one completed gesture producing one undo step, and redo restoring the exact committed result. Use channel edits before introducing a more complex drawing.

### 3. Separate persistent state from view-specific caches

`DataSourceEntry` holds both the descriptor and graphical objects/marks. The descriptor itself also contains `valid` and `visibleInViewport`. Sketchers receive this mutable aggregate even though their intended responsibility is display state. Screen paths, handles and marks depend on the viewport, while drawing coordinates and options describe the object independently of a view.

- Should view-specific state be owned by the viewport or a dedicated render store, and how should it be keyed using source ownership and drawing identity?
- Which derived values can be shared across views, and which depend on projection, dimensions, style or renderer?
- How will invalidation and removal work without adding unnecessary allocations to rendering hot paths?
- Preserve existing shared-drawing, serialization and history behavior. Validate the same logical drawing in two views with different scales/ranges, independent cache rebuilding, and model editing without constructing graphics. Measure rendering costs before choosing a replacement storage strategy.

Cache placement is an ownership concern, not an objection to caching. This migration must preserve reuse and is not justified by an assertion that graphical caches currently leak into saved JSON or history.

### 4. Type-check render/edit registration together

Sketchers and behaviors are registered in separate maps with string keys and permissive default data types. An incompatible pair can therefore escape compile-time validation. Input `Readonly` is also shallow.

- Would a typed drawing definition bind geometry data, sketcher, behavior and handle IDs without requiring a general plugin framework?
- Can it preserve drawings with no editing behavior, arbitrary extension keys and the existing public API migration path?
- Validate with compile-time rejection of mismatched data types and a custom drawing registered through the public API. Decide whether nested input immutability needs stronger typing rather than runtime copying in drag handlers.

### Sequencing and secondary questions

Start with picking and editing sessions as one bounded change, exercised through the channel. Cache ownership is a separate migration. Strengthen registration when a concrete extension makes its requirements clear; do not combine these into an engine rewrite.

The projection facade still includes display policy used by OHLCv, whose sketcher owns preferred-range calculation. Separating that policy from geometry remains open. `HasScale` supports the current top-level scale reference; nested/multiple references and versioned drawing-data validation need a separate design when such drawings are introduced. Removing Vue from engine orchestration is not a prerequisite for these steps.
