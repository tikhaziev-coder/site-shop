import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { publicPages, citySlugs, citySlug } from './routes.js';
import { products, branches, catalogTree } from './data.js';

export const publicFiles = ['styles.css', 'marketplace.css', 'checkout.css', 'app.js', 'marketplace.js', 'data.js', 'routes.js', 'state.js', 'ui.js', 'payments.js', 'checkout.js', 'navigation.js'];
export const pagePaths = [...new Set([
  ...Object.keys(publicPages), ...catalogTree.map(item => item.path),
  ...products.map(item => `/p/${item.id}`),
  ...products.filter(item => item.modelId).map(item => `/m/${item.modelId}`),
  ...Object.keys(citySlugs).map(city => `/shops/${city}`),
  ...branches.map(branch => `/shops/${citySlug(branch.city)}/${branch.id}`)
])];
const root = fileURLToPath(new URL('./', import.meta.url));

export async function buildSite({ destination = path.join(root, 'dist'), base = '/site-shop/' } = {}) {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('Base must be an absolute directory path ending in /');
  await mkdir(destination, { recursive: true });
  const html = (await readFile(path.join(root, 'index.html'), 'utf8')).replace('<base href="/">', `<base href="${base}">`);
  for (const filename of publicFiles) await copyFile(path.join(root, filename), path.join(destination, filename));
  await mkdir(path.join(destination, 'assets'), { recursive: true });
  for (const file of await readdir(path.join(root, 'assets'), { withFileTypes: true })) {
    if (file.isFile() && /^[a-zA-Z0-9_-]+\.(svg|png|jpg|webp|woff2?)$/.test(file.name)) await copyFile(path.join(root, 'assets', file.name), path.join(destination, 'assets', file.name));
  }
  for (const route of pagePaths) {
    const directory = path.join(destination, route.slice(1));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), html);
  }
  await writeFile(path.join(destination, '404.html'), html);
  await writeFile(path.join(destination, '.nojekyll'), '');
  await writeFile(path.join(destination, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  return { base, pages: pagePaths.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(await buildSite({ base: process.env.SITE_BASE || '/site-shop/' }));
}
