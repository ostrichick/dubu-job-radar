import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT || 4380);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) { res.writeHead(400).end(); return; }
  const full = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!full.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(full)).isFile()) throw new Error('not a file');
    const data = await readFile(full);
    res.writeHead(200, { 'Content-Type': mime[path.extname(full)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('File not found'); }
});

server.listen(port, '127.0.0.1', () => console.log(`Dubu Job Radar: http://127.0.0.1:${port}`));
