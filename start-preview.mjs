import { spawn } from 'node:child_process';
import { openSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const stdout = openSync(new URL('./server.stdout.log', import.meta.url), 'a');
const stderr = openSync(new URL('./server.stderr.log', import.meta.url), 'a');
const child = spawn(process.execPath, ['server.mjs'], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', stdout, stderr] });
child.unref();
writeFileSync(new URL('./preview.pid', import.meta.url), String(child.pid));
console.log(`Preview PID: ${child.pid}, URL: http://localhost:4173`);
