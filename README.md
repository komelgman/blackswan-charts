# blackswan-charts

An interactive Vue/TypeScript chart library with market data, drawing tools, multiple panes, extensible price scales and undo/redo.

## Explore the gallery

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The gallery has seven standalone examples: price/volume, panes, scales, drawing tools, shared drawings, history/persistence and a parallel channel. Each example has a permanent hash link, reset and the actual source code. All data is synthetic and deterministic; no API credentials are required.

Example: `/#/examples/channel`. Example factories live in `apps/charts-demo/src/gallery/examples`; add their metadata to `gallery/examples.ts`. Keep examples on the public `blackswan-charts` API and put engine behavior tests in the library, rather than making the gallery a functional test oracle.

## Packages

- `packages/charts-lib`: engine and Vue chart widgets.
- `packages/foundation`: shared primitives and utilities.
- `packages/layout`, `packages/layered-canvas`, `packages/context-menu`: reusable infrastructure.
- `apps/charts-demo`: gallery consuming the library.

## Build and validate

```sh
npm run typecheck
npm test
npm run build
```

`npm test` runs without a browser. For native browser wiring, use `npm run test:ct`; for gallery flows, use `npm run test:e2e` after installing Chromium with `npx playwright install chromium`. See [TESTING.md](TESTING.md) for details.

Packaged applications should load `blackswan-charts/style.css` along with the library. The gallery loads this stylesheet in production; development uses Vite's SFC styles.

[Architecture maps](docs/architecture/engine-lifecycle.md) · [Drawing extension contracts](docs/architecture/drawing-contracts.md) · [Price scales](docs/architecture/price-scales.md) · [Decisions](docs/decisions/DECISIONS.md)
