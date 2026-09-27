import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'school-role-based-backend', 'dist');

if (!fs.existsSync(path.join(source, 'index.html'))) {
  console.error('[build] Missing dist/index.html — run vite build first.');
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log('[build] Synced dist → school-role-based-backend/dist');
