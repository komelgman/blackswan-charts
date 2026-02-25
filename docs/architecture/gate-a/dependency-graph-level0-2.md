# Gate A Supporting Artifact: Dependency Graph Level 0-2

Date: 2026-02-11
Status: Filled

## Level 0
- `foundation`: standalone utilities and shared primitives.
- `context-menu/types`: depends on `foundation` only.
- `layered-canvas/model`: internal model types and worker abstractions.

## Level 1
- `PrimaryEntry`: local state + datasource refs.
- datasource helpers: datasource events/types + `foundation` utilities.

## Level 2
- `Axis`: axis incidents/types + `PrimaryEntry` + transaction coordination.
- `PriceAxis`: extends axis behavior + scale definitions + axis incidents.
- `PriceLabelsInvalidator`: depends on `PriceAxis` projection and render context.

## Sequencing Rule
- Migrate leaf contracts first.
- Introduce transaction port before extracting axis core.
- Add bridge only where migrated module touches legacy neighbors.
