## Incremental Improvement Instructions

### Trivial Recommendations
- When adding any new @/components/* import under **rontend/packages/charts-lib/src/model/**, add an inline DECISION: comment explaining why a model/type-defs or model/ui-ports contract was not used, and add a matching entry to frontend/docs/decisions/DECISIONS.md.
- When introducing or expanding usage of 
oHistoryManagedUpdate or 
oHistoryManagedEntriesProcess, add a DECISION: note clarifying why history must be bypassed and link to the specific test that guards the behavior in docs/decisions/DECISIONS.md.
- When a change alters shared-drawing behavior or data-binding semantics (even if behavior is preserved), add a brief DECISIONS entry stating the invariant that must remain true (e.g., external refs are still excluded from serialization).

### Non-Trivial Recommendations
#### Improvement 1
Description: Add an automated boundary-drift guard that fails if new @/components/* imports appear in **rontend/packages/charts-lib/src/model/**. This prevents erosion of the documented legacy coupling without a refactor.
Scope: **rontend/eslint.config.js or a lightweight check in **rontend/package.json scripts; allowlist file in frontend/docs/architecture/ or frontend/docs/decisions/.
Priority: High.
Risks/Constraints: Must not break existing legacy imports; include an allowlist of current violations. Early warning signal: any new @/components/* import in model should fail CI unless explicitly allowlisted with a DECISION.
Suggested approach:
1. Capture the current set of model->components imports as an allowlist file (text list of file+import lines).
2. Add a script (e.g., 
pm run lint:boundaries) that uses 
g to find @/components imports in **rontend/packages/charts-lib/src/model/** and compares to the allowlist.
3. Wire the script into CI or local checks; require a DECISION entry to update the allowlist.

#### Improvement 2
Description: Create a model/ui-ports (or model/type-defs/ui) module for new shared UI contracts so new features stop pulling UI types into the core. This incrementally reduces coupling without a mass migration.
Scope: **rontend/packages/charts-lib/src/model/ui-ports/**, **rontend/packages/charts-lib/src/components/**, **rontend/packages/charts-lib/src/model/**.
Priority: Medium.
Risks/Constraints: Do not mass-move existing types; only move low-risk leaf types when already touching them. Early warning signal: new feature adds @/components/* imports to model instead of using model/ui-ports.
Suggested approach:
1. Add a new ui-ports directory with type-only exports.
2. For any new shared types created by a feature, place them in ui-ports and import from both sides.
3. If touching an existing type that is safe to move, relocate it with a minimal re-export and add a DECISION entry.

#### Improvement 3
Description: Add targeted unit tests that assert no-history paths do not corrupt history semantics. This makes the transaction system safer without changing behavior.
Scope: frontend/packages/charts-lib/tests/unit/model/datasource/DataSource.spec.ts, frontend/packages/charts-lib/tests/unit/model/chart/axis/PriceAxis.spec.ts, frontend/packages/charts-lib/tests/unit/model/databinding/DataBinding.spec.ts, frontend/packages/charts-lib/tests/unit/model/chart/Chart.spec.ts.
Priority: High.
Risks/Constraints: Avoid DOM or heavy integration tests; keep tests focused on invariants. Early warning signal: new 
oHistoryManaged* usage without a companion test.
Suggested approach:
1. Add tests that perform 
oHistoryManagedEntriesProcess and verify data mutates while history count/undo state remains stable.
2. Add tests for PriceAxis.noHistoryManagedUpdate to ensure undo/redo is unaffected and range/scale updates are immediate.
3. Add a DataBinding test that ensures content updates use no-history mutation but do not add history entries.

#### Improvement 4
Description: Expand shared-drawing and serialization coverage to guard cross-data-source complexity and keep behavior explicit.
Scope: frontend/packages/charts-lib/tests/unit/model/datasource/DataSourceInterconnect.*, frontend/packages/charts-lib/tests/unit/model/chart/serialization/ChartSerializer.spec.ts, frontend/docs/architecture/engine-lifecycle.md.
Priority: Medium.
Risks/Constraints: Tests must reflect current documented behavior (e.g., external refs are dropped on serialization). Early warning signal: new features rely on shared drawings across panes without tests covering share/unshare/detach or serialization outcomes.
Suggested approach:
1. Add unit tests for shareWith='*' and selective sharing to ensure add/update/remove propagate and detach cleanly.
2. Add a serialization test confirming external/shared drawings are excluded, matching frontend/docs/decisions/DECISIONS.md.
3. Update the lifecycle doc to state the invariant explicitly and reference the tests.

#### Improvement 5
Description: Document the core boundary and transaction invariants in the architecture map to reduce implicit knowledge and re-entry cost.
Scope: frontend/docs/architecture/engine-lifecycle.md, frontend/docs/architecture/rendering-flow.md.
Priority: Medium.
Risks/Constraints: Keep it short and invariant-focused; avoid duplicating ADR content. Early warning signal: engineers regularly ask where to put types/behavior or accidentally bypass history.
Suggested approach:
1. Add a Boundary and Invariants section listing accepted legacy couplings and forbidden new ones.
2. Add a History Usage subsection outlining when no-history paths are allowed and the required tests.
3. Link to frontend/docs/decisions/ADR0001-... and frontend/docs/decisions/DECISIONS.md for rationale.

Notes: This file is versioned and should be periodically updated to reflect current state.
