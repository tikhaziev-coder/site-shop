const defaultBase = typeof document === 'undefined' ? '/' : new URL(document.baseURI).pathname;

export function appPath(path, base = defaultBase) {
  if (base === '/') return path;
  if (path === base.slice(0, -1)) return '/';
  return path.startsWith(base) ? `/${path.slice(base.length)}` : path;
}

export function sitePath(path, base = defaultBase) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected an internal absolute path');
  return `${base.replace(/\/$/, '')}${appPath(path, base)}`;
}
