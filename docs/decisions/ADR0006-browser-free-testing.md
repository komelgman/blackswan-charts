# ADR0006: Browser-free behavioral and rendering contracts

Date: 2026-09-28. Status: accepted.

## Context

Screenshots couple correctness to fonts, rasterization, DPR and browser timing. The model already runs under Node with Vue reactivity. Pane calculations lived in a Vue component; label/grid drawing lived in worker entry points that instantiate browser globals.

## Decision

- Move allocation/resize into `@blackswan/layout/model` functions used by Multipane and tests. Keep DOM measurement/application in Multipane.
- Add `Chart.recordPaneResize(event)`. Sizes are already applied by the adapter; the model records them with `immediate: false` and existing 1000 ms grouping semantics.
- Extract label/grid drawing functions inside their existing layer modules. Workers invoke the same functions tested by recording Canvas; no scene graph or command buffering is added to production.
- Add fast-check as a development dependency for generated layouts and model-based history sequences with shrinking/replay. Retain 144 deterministic operation pairs and named regressions.
- Default tests run in Node; four browser tests cover native hit testing, events, DOM sizing and component lifecycle without screenshot equality.

Scope: layout model/component, Chart/ChartWidget, axis/viewport workers, test support/config/scripts. No new model-to-component dependency is introduced. Identity remains source plus local drawing ID; there is no import/ID migration.

## Alternatives and consequences

Pinned fonts/browsers or screenshot tolerances cannot validate hidden state or new interaction sequences. Browser emulation/native canvas retains environment dependencies. A scene graph adds indirection/allocation to continuous render/drag hot paths. Reusing existing algorithms with boundary fakes avoids these costs.

Extraction adds one function call per label/grid frame and no extra per-item production allocation. Text cache invalidation is conditional on font/fraction/context changes. No performance claim beyond this structural reasoning is made. Test recorders allocate freely and never ship as runtime dependencies.

The generated model covers a documented subset. Raster appearance, CSS and native hit testing remain browser responsibilities. Expand commands as features become supported and preserve seed/path replay. This boundary is permanent.
