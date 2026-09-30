import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Run against a built gallery preview, then rebuild the demo to copy these assets.
const origin = process.argv[2] ?? 'http://127.0.0.1:5180';
const output = new URL('../public/gallery/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 802, height: 1100 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await page.goto(`${origin}/#/`);
  const routes = await page.locator('.example-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')));
  for (const route of routes) {
    await page.goto(`${origin}/${route}`);
    const pause = page.getByRole('button', { name: 'Pause feed', exact: true });
    if (await pause.count()) await pause.click();
    const host = page.locator('.chart-host');
    await host.evaluate(element => { element.style.width = '740px'; element.style.height = '440px'; });
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.querySelectorAll('.priceline')].every(element => element.clientWidth > 20));
    // ResizeObserver and worker canvases finish asynchronously; this is asset capture, not a test oracle.
    await page.waitForTimeout(350);
    const id = route.split('/').at(-1);
    await host.screenshot({ path: fileURLToPath(new URL(`${id}.png`, output)) });
    console.log(`Rendered ${id}`);
  }
} finally {
  await browser.close();
}
