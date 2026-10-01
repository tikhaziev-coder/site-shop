import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSite, pagePaths, publicFiles } from '../build.mjs';
import { appPath, sitePath } from '../navigation.js';

test('маршруты одинаково работают из корня и подкаталога', () => {
  for (const base of ['/', '/site-shop/']) {
    for (const route of ['/checkout', '/p/g09', '/search?q=iPhone&city=all', '/']) {
      assert.equal(appPath(sitePath(route, base), base), route);
      assert.equal(sitePath(sitePath(route, base), base), sitePath(route, base));
    }
  }
  assert.equal(appPath('/site-shop/', '/site-shop/'), '/');
  assert.equal(appPath('/site-shopper/cart', '/site-shop/'), '/site-shopper/cart');
  assert.throws(() => sitePath('//external.example'), /internal/);
});

test('статическая сборка включает все прямые маршруты и только публичные файлы', async () => {
  const destination = await mkdtemp(path.join(os.tmpdir(), 'sks-public-build-'));
  try {
    const result = await buildSite({ destination });
    assert.equal(result.pages, pagePaths.length);
    for (const route of pagePaths) {
      const html = await readFile(path.join(destination, route.slice(1), 'index.html'), 'utf8');
      assert.ok(html.includes('<base href="/site-shop/">'), route);
      assert.ok(html.includes('noindex, nofollow'));
    }
    const files = await readdir(destination, { recursive: true });
    for (const name of ['README.md', 'MARKETING-ALIGNMENT.md', '.local', 'node_modules', 'lan.pid', 'server.mjs', 'enable-lan-firewall.ps1']) assert.ok(!files.includes(name), name);
    for (const name of [...publicFiles, '404.html', '.nojekyll', 'robots.txt']) assert.ok(files.includes(name), name);
    const html = await readFile(path.join(destination, '404.html'), 'utf8');
    assert.ok(html.includes('<base href="/site-shop/">'));
    await assert.rejects(buildSite({ destination, base: '/../../' }));
  } finally {
    assert.ok(path.basename(destination).startsWith('sks-public-build-'));
    assert.equal(path.dirname(destination), path.resolve(os.tmpdir()));
    await rm(destination, { recursive: true, force: true });
  }
});
