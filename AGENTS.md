# AGENTS.md

## Project Purpose and Vision
blackswan-charts is a Vue + TypeScript monorepo that ships a reusable charting library (`charts-lib`) and a demo app (`charts-demo`). The goal is a high-performance interactive chart engine with predictable state transitions, reliable undo/redo, and a stable public API. The architectural vision is to keep the chart engine cohesive and testable, with Vue-specific UI and canvas adapters at the edges.

## Repo Map
- Library source: `frontend/packages/charts-lib/src`
- Layout package: `frontend/packages/layout/src`
- Layered-canvas package: `frontend/packages/layered-canvas/src`
- Library tests: `frontend/packages/charts-lib/tests`
- Demo app source: `frontend/apps/charts-demo/src`
- Demo tests: `frontend/apps/charts-demo/tests`
- Shared config: `frontend/package.json`, `frontend/tsconfig*.json`, `frontend/eslint.config.js`
- Git metadata: `frontend/.git` (run Git commands from `frontend/`)
- Generated outputs: `frontend/packages/charts-lib/dist`, `frontend/packages/charts-lib/test-results`, `frontend/apps/charts-demo/dist`, `frontend/apps/charts-demo/tests/.e2e-report`

## Build/Lint/Test (run from `frontend/`)
- `npm install`
- `npm run dev`
- `npm run build:lib`
- `npm run build:demo`
- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run test:ct`
- `npm run test:e2e`
- Testing details: `frontend/TESTING.md`

## Current Architecture (Actual)
- `packages/charts-lib/src/model` is the core chart engine: chart, axes, viewport, data sources, history and transactions, sketchers, render layers, and data binding.
- `packages/charts-lib/src/components` provides Vue UI wrappers and shared UI infrastructure such as layout, layered-canvas, and context-menu.
- The demo app `apps/charts-demo` consumes the library.
- Known coupling: `model` imports types and render helpers from `components` (layout, layered-canvas, context-menu). This is accepted legacy debt and must not grow.

## Priority Order (When Rules Conflict)
1. Correctness and data integrity (chart state, history, transactions).
2. Performance in hot paths (see "Hot Paths and Performance Exceptions").
3. Architectural boundaries and dependency direction.
4. Test coverage and safety nets.
5. Readability and aesthetics.

## Dependency Direction Rules (Mandatory)
- `apps/*` may depend on `packages/*` only. No library code depends on apps.
- `components` depends on `model` and `components/*`, not the other way around.
- `model` must not import Vue SFCs or app code. Keep UI-only behavior in `components`.

- `model` may depend on `@blackswan/layout/model` and `@blackswan/layered-canvas/model`, not on any `@blackswan/*/components`.
- `@blackswan/layout/components` and `@blackswan/layered-canvas/components` may depend only on their own `model` submodule, `@blackswan/foundation`, and Vue.
- Shared event and type contracts must live in `model/type-defs` or a dedicated `model/ui-ports` module, not inside UI components.
- Public API is defined in `packages/charts-lib/src/index.ts`. Add exports deliberately.
- Violations of dependency direction are a last resort and require a Decision Record with evidence.

## Legacy Coupling Guardrails (Do Not Grow)
Legacy coupling is considered increased if any of the following occur:
- new `@/components/*` imports are added under `packages/charts-lib/src/model`,
- new Vue or reactivity types are introduced into `model` beyond existing usage,
- new UI-layer render helpers are pulled into `model` instead of pushed through adapter interfaces.
If a shared type or contract is needed, move it to `model/type-defs` or `model/ui-ports` and update both sides.

## Hot Paths and Performance Exceptions
Hot paths include:
- render loop and layered-canvas redraw,
- sketcher drawing and hit-testing,
- viewport invalidation and highlighting,
- data source iteration/filtering and entry updates during interaction,
- axis label layout and rendering,
- drag/zoom/pan input handlers.
A path is treated as hot only when at least one of the following is true:
- a profiler or benchmark shows it on the critical path,
- it runs every animation frame or on continuous user input,
- it processes large datasets (order of tens of thousands or more) on the main thread.
Performance-motivated deviations from dependency rules are allowed only with a Decision Record (see below).
The change author is responsible for classifying a hot path and documenting the evidence in the Decision Record.

## Core Architectural Principles
- SOLID and explicit ownership of state.
- Dependency inversion: the engine should depend on interfaces or simple types, not concrete UI components.
- Clean or hexagonal adaptation: `model` is the core, Vue components and canvas layers are adapters at the boundary.
- Vertical slice delivery: model, UI, and tests evolve together per feature.
- Modular monorepo: the library is reusable and versioned; the demo app is a consumer.

## Code Organization Rules
- Libraries contain reusable logic and UI primitives. Apps contain composition, wiring, and demo-only behavior.
- Do not deep-import from `packages/charts-lib/src` in apps. Use the public API only.
- Changes to `model` must not require editing `components` unless a true UI adapter change is needed.
- Avoid new cross-imports from `model` to `components`. If a shared type is needed, move it to `model/type-defs` or `model/ui-ports` and update both sides.
- Do not edit generated artifacts in `dist` or test reports.
- Domain invariants, core rules, and state transitions must stay in `model`. Do not move or reimplement them in `components` under the guise of UI logic.
- Adapter code in `components` may translate inputs, events, or render state, but must not own domain decisions or validation.

## Technical Debt Policy (Mandatory)
Any change must reduce or keep technical debt neutral - never increase it.

### Architectural Debt
Root cause: the engine (`model`) currently depends on UI-layer types and Vue reactivity, blurring domain vs UI boundaries.
Impact: portability and testability are reduced; cycles and refactors are harder.
Strategy: incrementally extract shared types into `model` or a `model/ui-ports` area, and isolate Vue reactivity in adapters rather than core logic.

### Structural Debt
Root cause: large central classes (`Chart`, `Viewport`, `DataSource`) carry multiple responsibilities for performance and convenience.
Impact: high change coupling and harder reasoning about side effects.
Strategy: extract cohesive helpers by behavior (selection, dragging, history) without over-abstraction; keep algorithms local but name and isolate responsibilities.

### Test-Related Debt
Root cause: uneven coverage of core engine logic, with heavier emphasis on component snapshots.
Impact: regressions in state transitions or algorithms are easy to miss.
Strategy: add unit tests for model and data binding, and integration tests for cross-component flows; treat snapshots as a supplement, not the primary check.

### Domain and State-Management Debt
Root cause: manual wiring of transactions and shared mutable state across chart, data sources, and viewports.
Impact: subtle ordering bugs and hard-to-debug state.
Strategy: document ownership, assert invariants at boundaries, and introduce explicit lifecycle hooks at composition roots.

## Pragmatic Architecture Rules
- Prefer clarity and performance over purity in hot paths (rendering, invalidation, data source processing).
- Avoid extra indirection when it makes algorithms harder to reason about or slower.
- Deviations from purity must be localized and documented via a Decision Record (see below).

## Decision Record for Deviations (Mandatory)
Any deviation from dependency direction rules, hot-path purity, or normal abstraction guidance must include:
- reason and expected benefit,
- affected modules or files,
- alternatives considered and why rejected,
- evidence (benchmark/profile) or explicit reasoning,
- whether the deviation is temporary and a follow-up plan.
Record it in a code comment tagged `DECISION:` near the boundary or in the change description.

Decision Record template:
```txt
DECISION:
Reason:
Benefit:
Scope (modules/files):
Alternatives considered:
Evidence or rationale:
Temporary? Follow-up:
```

Non-trivial Decision Records:
- Summarize in `frontend/docs/decisions/ADR{number}-{title}.md` (repo root).
- Use the next available number (4 digits) and a short kebab-case title.
- Link the ADR from `frontend/docs/decisions/DECISIONS.md`.
Non-trivial includes:
- dependency direction violations,
- new dependencies or framework adoption,
- public API changes,
- cross-module moves that affect boundaries,
- performance trade-offs in hot paths.
Trivial Decision Records:
- Keep the inline `DECISION:` comment and add an entry to `frontend/docs/decisions/DECISIONS.md`.

## Testing Policy
- TDD is preferred for new functionality.
- New or modified behavior requires tests, and critical or low-coverage code must be backfilled.
Critical areas include:
- history, transactions, undo/redo (`model/history`),
- data source mutations, shared entries, invalidation (`model/datasource`),
- viewport selection, dragging, hit-testing,
- axis scaling and range conversions,
- serialization and deserialization.
- Maintain a clear split between unit, integration, and component tests.
- Tests validate behavior, not implementation details.
- Excessive mocking is a design smell; prefer fakes or real objects.
- Follow `frontend/TESTING.md` for tooling and commands.
Test deferral is allowed only for time-boxed spikes or performance experiments, or doc-only changes. When deferring, record rationale and add a follow-up task.

## Engineering Standards (Mandatory)
Abstractions: no abstraction without at least two real use cases. Readability and changeability trump elegance.
Change strategy: incremental refactoring only; no big-bang rewrites; preserve behavior.
Observability: errors must be explicit, actionable, and include context; avoid silent catches.
Documentation: document why and tradeoffs, not what.
Human Re-entry Invariant: At any point, a single experienced engineer should be able to identify the core execution flow, locate state ownership, and understand why non-obvious decisions exist, using code structure and ADRs without relying on AI assistance.
Implicit behavior across module boundaries is forbidden unless documented as a Decision. Avoid non-obvious side-effects, implicit ordering between modules, or "it works because it evolved that way."

## Entry Points (Maintain These Maps)
Keep these non-tutorial maps current for onboarding and debugging:
- `frontend/docs/architecture/engine-lifecycle.md`
- `frontend/docs/architecture/rendering-flow.md`

## AI Agent Rules
- Allowed: targeted fixes, refactors that reduce debt, tests, and documentation updates.
- Requires justification: new dependencies, new patterns or frameworks, public API changes, cross-module moves, or performance tradeoffs.
- Must not: aesthetic-only refactors, unnecessary indirection, or splitting cohesive algorithms into artificial layers.
- If architectural purity conflicts with performance or clarity, choose performance or clarity and document the decision.
- In ambiguous cases, prefer preserving existing behavior and structure.
Cosmetic refactors include:
- renaming without behavior or API change,
- splitting or merging functions without reduced complexity,
- moving code solely for style consistency,
- abstraction without at least two real use cases.

## Quality Acceptance Criteria
A change is high quality when:
- Technical debt is reduced or kept neutral.
- Code is easier to reason about.
- Architectural boundaries are clearer.
- Test coverage meaningfully improves.
- Performance characteristics are preserved or improved.

## Skills
Codex skill usage guidance lives in `frontend/SKILLS.md` (infrastructure-level).
