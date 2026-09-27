import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const express = require('../school-role-based-backend/node_modules/express');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.env.STATIC_BASE_PATH || '/web').replace(/\/$/, '') || '/web';
const baseWithSlash = `${base}/`;
const port = Number(process.env.FRONTEND_PORT || 8080);
const host = process.env.HOST || '0.0.0.0';

function resolveStaticDir() {
  if (process.env.STATIC_DIR) return path.resolve(process.env.STATIC_DIR);
  const candidates = [
    path.join(root, 'dist', 'web'),
    path.join(root, 'school-role-based-backend', 'dist', 'web'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  }
  return path.join(root, 'dist', 'web');
}

const staticDir = resolveStaticDir();

if (!fs.existsSync(path.join(staticDir, 'index.html'))) {
  console.error(`[frontend] Missing ${staticDir}/index.html — run "npm run build" first.`);
  process.exit(1);
}

const app = express();

const sendIndex = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.sendFile(path.join(staticDir, 'index.html'), (err) => {
    if (err) next(err);
  });
};

app.use(base, express.static(staticDir, { index: 'index.html' }));
app.get(base, (_req, res) => res.redirect(301, baseWithSlash));
app.get(baseWithSlash, sendIndex);
app.get(`${base}/*`, (req, res, next) => {
  const lastSegment = req.path.split('/').pop() || '';
  if (path.extname(lastSegment)) return next();
  sendIndex(req, res, next);
});
app.get('/', (_req, res) => res.redirect(302, baseWithSlash));

app.use((_req, res) => {
  res.status(404).send('Not found');
});

app.listen(port, host, () => {
  const localHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`[frontend] http://${localHost}:${port}${baseWithSlash}`);
  console.log(`[frontend] Static files: ${staticDir}`);
});
