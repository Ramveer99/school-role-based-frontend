import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.env.STATIC_BASE_PATH || '/').replace(/\/$/, '') || '';
const baseWithSlash = `${base}/`;
const port = Number(process.env.FRONTEND_PORT || 8080);
const host = process.env.HOST || '0.0.0.0';

function resolveStaticDir() {
  if (process.env.STATIC_DIR) return path.resolve(process.env.STATIC_DIR);
  const candidates = [
    path.join(root, 'dist'),
    path.join(root, 'school-role-based-backend', 'dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  }
  return path.join(root, 'dist');
}

const staticDir = resolveStaticDir();
const indexPath = path.join(staticDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`[frontend] Missing ${indexPath} — run "npm run build" first.`);
  process.exit(1);
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(statusCode, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
}

function sendIndex(res) {
  sendFile(res, indexPath);
}

function redirect(res, location, statusCode = 302) {
  res.writeHead(statusCode, { Location: location });
  res.end();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  if (pathname === '/' || pathname === base || pathname === baseWithSlash) {
    sendIndex(res);
    return;
  }

  if (base && pathname.startsWith(`${base}/`)) {
    const relativePath = pathname.slice(base.length + 1);
    const filePath = path.join(staticDir, relativePath);
    const normalized = path.normalize(filePath);

    if (!normalized.startsWith(staticDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
      sendFile(res, normalized);
      return;
    }

    const lastSegment = pathname.split('/').pop() || '';
    if (!path.extname(lastSegment)) {
      sendIndex(res);
      return;
    }
  } else if (!base) {
    const filePath = path.join(staticDir, pathname.slice(1));
    const normalized = path.normalize(filePath);

    if (!normalized.startsWith(staticDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
      sendFile(res, normalized);
      return;
    }

    const lastSegment = pathname.split('/').pop() || '';
    if (!path.extname(lastSegment)) {
      sendIndex(res);
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(port, host, () => {
  const localHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`[frontend] http://${localHost}:${port}${baseWithSlash}`);
  console.log(`[frontend] Static files: ${staticDir}`);
});
