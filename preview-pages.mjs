import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const base = '/site-shop/';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' };
http.createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405).end();
  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(base)) return response.writeHead(404).end('Not found');
    let target = path.resolve(root, pathname.slice(base.length));
    if (target !== path.resolve(root) && !target.startsWith(root)) return response.writeHead(403).end();
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith('/')) return response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
      target = path.join(target, 'index.html');
    }
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : await readFile(path.join(root, '404.html')));
  }
}).listen(4175, '127.0.0.1', () => console.log('Pages preview: http://127.0.0.1:4175/site-shop/'));
