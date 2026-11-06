#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const usage = 'Usage: npm run extract -- --url <http(s) URL> [--theme light|dark] [--out <file>]';

try {
  const { values } = parseArgs({
    options: {
      url: { type: 'string' },
      theme: { type: 'string', default: 'light' },
      out: { type: 'string', default: 'out/brand.json' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(usage);
  } else {
    const url = new URL(values.url ?? '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Use an HTTP or HTTPS URL without embedded credentials.');
    }
    if (!['light', 'dark'].includes(values.theme)) {
      throw new Error('Theme must be light or dark.');
    }

    const report = await extract(url, values.theme);
    const output = resolve(values.out);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    console.log(output);
  }
} catch (error) {
  console.error(`Brand Extract: ${error.message}\n${usage}`);
  process.exitCode = 1;
}

async function extract(url, theme) {
  const browser = await chromium.launch();
  try {
    const viewport = { width: 1440, height: 900 };
    const page = await browser.newPage({
      viewport,
      colorScheme: theme,
      acceptDownloads: false,
      serviceWorkers: 'block',
    });
    const response = await page.goto(url.href, { waitUntil: 'load', timeout: 30_000 });
    if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status() ?? 'unknown'}.`);
    await page.evaluate(() => Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3_000)),
    ]).then(() => undefined));

    const [palette, typography, layout] = await Promise.all(
      ['palette', 'typography', 'layout'].map(async name => {
        const source = await readFile(new URL(`./probes/${name}.js`, import.meta.url), 'utf8');
        return page.evaluate(source);
      }),
    );
    const source = new URL(page.url());
    return {
      schemaVersion: 1,
      source: { url: source.origin + source.pathname, theme, viewport },
      colors: palette,
      typography,
      layout,
    };
  } finally {
    await browser.close();
  }
}
