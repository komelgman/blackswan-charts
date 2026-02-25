# Gate A Deliverable D3: Benchmark Protocol and Baseline

Date: 2026-02-11
Status: Filled

## Objective
Define measurement protocol and record baseline for current Vue implementation before POC extraction.

## Environment
- Runtime: Node.js with `--expose-gc`.
- Source under test: `frontend/packages/charts-lib/dist/index.cjs`.
- Machine profile: single machine, same session for baseline run.
- Devtools: not applicable (Node run).

## Protocol
- Warmup iterations per operation: `200`.
- Measured iterations per operation: `2000`.
- Repeats per operation: `5` full runs.
- Reported metrics: median-of-runs `p50`, `p95`, `p99` wall time in ms.
- Allocation proxy: median heap delta (`process.memoryUsage().heapUsed`) per run.
- Operations:
  - `setRange`
  - `toggleInvert`
  - `setPrimaryEntry`
  - `clearPrimaryEntry`

## Benchmark Invocation
- Executed in this session with a Node script that imports `packages/charts-lib/dist/index.cjs` and runs the protocol above.

## Baseline Results (Current Vue Implementation)

| Operation | p50 (ms) | p95 (ms) | p99 (ms) | Heap delta (bytes) | Notes |
| --- | --- | --- | --- | --- | --- |
| `setRange` | 0.0103 | 0.0144 | 0.0357 | 46768 | alternating range values |
| `toggleInvert` | 0.0018 | 0.0019 | 0.0041 | 8536 | repeated invert toggles |
| `setPrimaryEntry` | 0.0093 | 0.0105 | 0.0208 | 1054872 | rotating refs over one datasource |
| `clearPrimaryEntry` | 0.0032 | 0.0038 | 0.0102 | 2543384 | each measured clear preceded by a set |

## Gate Threshold Application
- Candidate p95 must be within `+10%` of baseline p95 for each operation.
- If baseline p95 < 20 ms, candidate must also stay within `+2.0 ms` absolute increase.
- Gate B fails on first violating operation.

## Limitations
- Node-only measurement does not include browser layout/paint cost.
- Heap deltas can vary with GC timing and should be used as directional signal, not absolute pass/fail alone.
