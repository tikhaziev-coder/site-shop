import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../server.mjs';

test('сетевой сервер отдаёт страницы и ресурсы, но не служебные файлы', async () => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/', '/zoloto', '/p/g01', '/p/g09', '/login', '/checkout', '/m/iphone-13-128', '/app.js', '/payments.js', '/checkout.js', '/checkout.css', '/assets/plex-Regular.woff2']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      await response.arrayBuffer();
    }
    for (const route of ['/README.md', '/server.mjs', '/lan.pid', '/server.stdout.log', '/package.json', '/node_modules/@playwright/test/package.json', '/assets/%2e%2e%2fserver.mjs', '/missing-route']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 404, route);
      await response.arrayBuffer();
    }
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
    assert.equal(await (await fetch(base + '/zoloto', { method: 'HEAD' })).text(), '');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
