import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const qa = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(await readFile(path.join(qa, 'tracked-sha256-before.json'), 'utf8'));
const allowed = new Set(['frontend/package.json', 'frontend/package-lock.json', 'AGENTS.md']);
const changed = [];
const checked = [];
for (const entry of baseline) {
  const bytes = await readFile(path.resolve(entry.path));
  const hash = createHash('sha256').update(bytes).digest('hex');
  const row = { path: entry.path, sha256: hash, unchanged: hash === entry.sha256 };
  if (allowed.has(entry.path)) { changed.push(row); continue; }
  checked.push(row);
}
const mismatches = checked.filter(row => !row.unchanged);
await writeFile(path.join(qa, 'protected-final.json'), JSON.stringify({ checked: checked.length, mismatches, allowedChanges: changed, files: checked }, null, 2) + '\n');
console.log(JSON.stringify({ checked: checked.length, mismatches, allowedChanges: changed.map(row => ({ path: row.path, unchanged: row.unchanged })) }));
if (mismatches.length) process.exitCode = 1;
