import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'dist', 'web');
const target = path.join(root, 'school-role-based-backend', 'dist', 'web');

if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error('[build] Missing dist/web/index.html — run vite build first.');
  process.exit(1);
}

fs.rmSync(path.join(root, 'school-role-based-backend', 'dist'), { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log('[build] Synced dist/web → school-role-based-backend/dist/web');
