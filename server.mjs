import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.pdf': 'application/pdf' };
const server = createServer((req, res) => {
  const requested = req.url?.split('?')[0] || '/';
  const file = normalize(join(root, requested === '/' ? 'index.html' : requested));
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
server.listen(4173, '0.0.0.0', () => console.log('Portfolio preview: http://0.0.0.0:4173'));
