# Gate A Supporting Artifact: Worker Boundary and Mappers

Date: 2026-02-11
Status: Filled

## Objective
Define worker boundary contract and mapper ownership for migration phases involving rendering layers.

## Boundary Contract
- Worker payloads must be plain DTOs.
- No Vue reactive objects, proxies, callbacks, or class instances in worker messages.
- Core domain events are not forwarded to workers directly.

## Mapper Ownership
- Mapper modules live with layer integration code.
- Adapter/integration layer maps from core state to worker DTO shape.
- Mapping is triggered by coarse invalidation signals or explicit render requests.

## Proposed Paths and Validation
- Proposed:
  - `frontend/packages/charts-lib/src/model/chart/axis/layers/integration/`
  - `frontend/packages/charts-lib/src/model/chart/viewport/layers/integration/`
  - `frontend/packages/charts-lib/src/model/workers/dto-mappers/`
- Current validation:
  - none of these paths exist yet in current codebase.
  - paths are proposed and must be created during implementation.

## Debug Forwarding
- Optional and opt-in only.
- Must be throttled or sampled in development.
- Disabled by default in production.
