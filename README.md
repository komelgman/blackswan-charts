# blackswan-charts

An interactive Vue/TypeScript chart library with market data, drawing tools, multiple panes, extensible price scales and undo/redo.

**[Explore the live demo →](https://komelgman.github.io/blackswan-charts/)**

## Explore the gallery

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The gallery has ten standalone examples, ordered from first integration to interaction and persistence. Each example has a permanent hash link, reset and the actual source code. All data is synthetic and deterministic; no API credentials are required.

Example: `/#/examples/channel`. Example factories live in `apps/charts-demo/src/gallery/examples`; add their metadata to `gallery/examples.ts`. Keep examples on the public `blackswan-charts` API and put engine behavior tests in the library, rather than making the gallery a functional test oracle.

The header links to the GitHub project, and each example links to its source. The source tabs link to their corresponding files: Example is the scene factory, Vue is the actual mounting component (including stylesheet and lifecycle), Setup contains shared chart/pane creation, Data contains synthetic prices, and Types contains the scene contracts. The first example creates its chart directly and does not need Setup. Events shows its actual mounting component with the tooltip, plus the tooltip source. Keep example-specific drawing helpers out of the shared setup.

The streaming example appends a candle and volume bar every second, retains at most 240 bars, and supports pause, manual stepping and follow mode. Feed updates bypass user-edit history. Time uses AUTO with justFollow, so incoming bars preserve the zoom window; panning switches to MANUAL and the Follow button reflects the axis state. Price uses AUTO and fits visible prices with native scale-aware padding. The Vue components start scenes on mount and dispose them on reset or navigation; timers must be released in `dispose`.

| Example | What to learn |
| --- | --- |
| [First chart](https://komelgman.github.io/blackswan-charts/#/examples/basic) | Chart → DataSource → pane → ChartWidget; required plot settings and container size. |
| Price & volume | Two plots using the same data; volume layer and primary price entry. |
| Streaming | External data updates, automatic fitting, native follow, timer lifecycle and no-history updates. |
| Scales | Linear, logarithmic and first-visible-price percentage scales with the same broad price series. |
| Panes | Independent sources/prices, shared time axis and resizing. |
| Drawings | Horizontal/vertical/inclined lines, dash styles, handles, copying and undo. |
| Channel | Built-in compound drawing with baseline and width handles; no extension registration. |
| Shared drawings | Owned/shared/local identities across two markets. |
| Object events | Public interaction handlers, selection, click/double-click and a Vue tooltip. |
| History & JSON | Two edits in one transaction, undo/redo, save and undoable restore. |

Chart/grid/text/menu/handle appearance comes from the built-in theme. Do not repeat those settings in the common setup. Current plot and drawing contracts still require explicit `barStyle`/`style`; theme defaults do not supply them. Keep style variation only where it teaches a feature or distinguishes ownership. OHLCv records are `[open, high, low, close, volume]`; `loaded`/`available` ranges use millisecond timestamps and `step` describes bar duration. Synthetic generation lives in Data so it does not obscure chart setup.

The gallery teaches integration and supported public features. A custom renderer/behavior or provider binding should be a separate advanced recipe, with its own working implementation; the built-in channel must not be presented as a custom extension.

Card previews are actual chart captures, not separate hand-drawn illustrations. To refresh them after changing examples, build and start a preview, then run `npm -w apps/charts-demo run thumbnails -- http://127.0.0.1:5180` (substitute your preview URL) and `npm run build:demo`. The generator writes `apps/charts-demo/public/gallery/*.png`; these are display assets, never screenshot-test expectations.

## Publish the demo

[GitHub Pages](https://komelgman.github.io/blackswan-charts/) is updated by [the Pages workflow](.github/workflows/pages.yml) on every push to `master`; it can also be run manually from Actions. The workflow installs locked dependencies, runs Node tests, builds the library and demo, and checks the production build in Chromium before publishing `apps/charts-demo/dist`. Generated build output is not committed.

The workflow gets the site's base path from GitHub Pages and passes it as `DEMO_BASE_PATH` to both Vite and the browser tests. Local development defaults to `/`. For a local Pages-style build, set `DEMO_BASE_PATH=/blackswan-charts/` in your shell before running `npm run build`; keep the same variable when starting the preview or browser tests. Hash routes work without server rewrites. In a fork, enable **Settings → Pages → Source → GitHub Actions** and update the demo links in this README.

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
