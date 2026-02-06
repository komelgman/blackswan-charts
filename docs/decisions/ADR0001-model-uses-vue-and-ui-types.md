# ADR0001: Model Uses Vue Reactivity and UI-Layer Types

## Context
The core engine under `frontend/packages/charts-lib/src/model` directly imports Vue reactivity helpers and UI-layer types/render helpers. Examples include `Chart.ts` using `reactive`, `computed`, and `watch`, and model layers importing `@/components/layered-canvas` types and render layer classes. The `NonReactive` decorator uses Vue `markRaw` to opt objects out of reactivity.

## Decision
The model layer is implemented with Vue reactivity and depends on UI-layer types/render infrastructure (layered-canvas, layout, context-menu). Performance-sensitive model classes are marked `NonReactive` to avoid Vue proxying while keeping Vue integration.

## Rationale
Using Vue reactivity in the model provides immediate compatibility with Vue adapters and reactive UI updates. The presence of `NonReactive` suggests a deliberate mitigation of reactivity overhead in hot paths while keeping a single reactive state system. (Assumption based on use of `markRaw` in the decorator.)

## Alternatives considered
- Keep the model framework-agnostic and expose adapters or `model/ui-ports` interfaces for UI integration.
- Use a separate event-emitter or store layer and keep Vue types confined to components.

## Consequences
- Positive: Model state is directly reactive for Vue components; adapter complexity is reduced.
- Negative: The model is coupled to Vue and UI-layer types, reducing portability and tightening dependency direction.

## Update (2026-02-06)
Generic primitives and shared utilities (including Point, Range, type-defs helpers, and document listeners) were moved into the new `packages/foundation` package. This reduces incidental coupling, but the model layer still depends on Vue reactivity and UI-layer types for rendering and interactions.
