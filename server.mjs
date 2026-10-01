import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { resolveRoute } from './routes.js';

const root = fileURLToPath(new URL('./', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const publicFiles = new Set(['/index.html', '/styles.css', '/marketplace.css', '/checkout.css', '/app.js', '/marketplace.js', '/data.js', '/routes.js', '/state.js', '/ui.js', '/payments.js', '/checkout.js', '/navigation.js']);

export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
  try {
    const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (requested === '/robots.txt') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : 'User-agent: *\nDisallow: /\n');
      return;
    }
    const isPage = path.extname(requested) === '';
    const isAsset = /^\/assets\/[a-zA-Z0-9_-]+\.(svg|png|jpg|webp|woff2?)$/.test(requested);
    if (!isPage && !publicFiles.has(requested) && !isAsset) {
      response.writeHead(404).end('Not found');
      return;
    }
    const target = path.resolve(root, '.' + (isPage ? '/index.html' : requested));
    if (!target.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(target);
    const status = isPage && resolveRoute(requested).type === 'notfound' ? 404 : 200;
    response.writeHead(status, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
  }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.PREVIEW_HOST || '127.0.0.1';
  const port = Number(process.env.PREVIEW_PORT || 4173);
  createPreviewServer().listen(port, host, () => console.log(`SKS prototype: http://${host}:${port}`));
}
