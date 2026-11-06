import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));

test('extracts computed styles from a real page', async (t) => {
  const fixture = await readFile(new URL('../examples/site.html', import.meta.url));
  const server = createServer((_, res) => res.writeHead(200, { 'Content-Type': 'text/html' }).end(fixture));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const dir = await mkdtemp(join(tmpdir(), 'brand-extract-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const args = [cli, '--url', url + '?private=fixture-marker#fragment', '--theme', 'dark'];
  await run(process.execPath, args, { cwd: dir });
  const raw = await readFile(join(dir, 'out/brand.json'), 'utf8');
  const report = JSON.parse(raw);
  assert.equal(report.source.url, url);
  assert.equal(report.source.theme, 'dark');
  assert.ok(report.colors.some(({ hex, contexts }) => hex === '#17231e' && contexts.bg));
  assert.ok(report.colors.some(({ hex, contexts }) => hex === '#23614e' && contexts.bg));
  assert.equal(report.typography.headings.h1.fontFamily, 'Georgia, serif');
  assert.equal(report.typography.headings.h1.fontSize, '48px');
  assert.ok(report.layout.scales.gap.includes(12));
  assert.deepEqual(report.layout.scales.radius, [8, 16]);
  assert.doesNotMatch(raw, /fixture-marker|Read notes/);
  await assert.rejects(run(process.execPath, args, { cwd: dir }), /EEXIST/);
});

test('rejects non-web and credential-bearing URLs', async () => {
  for (const url of ['file:///tmp/example', 'https://user:secret@example.com']) {
    await assert.rejects(run(process.execPath, [cli, '--url', url]), /without embedded credentials/);
  }
});
