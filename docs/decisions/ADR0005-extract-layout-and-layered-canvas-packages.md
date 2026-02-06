# ADR0005: Extract Layout and Layered-Canvas Packages

## Context
`layout` and `layered-canvas` lived under `charts-lib/src/components`. The model imported their types and render helpers, violating the desired dependency direction and coupling the core engine to UI component paths.

## Decision
Extract `layout` and `layered-canvas` into their own packages:
- `@blackswan/layout` with `src/model` and `src/components`
- `@blackswan/layered-canvas` with `src/model` and `src/components`

`charts-lib/model` depends only on `@blackswan/*/model`. Vue components are isolated under `@blackswan/*/components` and may depend only on `@blackswan/foundation`, their own `model` module, and Vue.

## Rationale
This separates engine logic from UI components while preserving existing Vue-based behavior. It removes direct `model -> components` imports and makes the UI packages reusable without entangling them with chart model internals.

## Consequences
- Positive: Clearer dependency boundaries; UI components are isolated; model uses stable model submodules.
- Negative: Additional packages to maintain; still not framework-agnostic (Vue types remain in the model modules).

