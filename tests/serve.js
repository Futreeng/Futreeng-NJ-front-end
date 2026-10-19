// Static server for the tests. Serves pitch/deploy the way Vercel does for
// this project: cleanUrls, plus every header from pitch/deploy/vercel.json,
// so the tests run under the real Content-Security-Policy.
// Usage: node tests/serve.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'pitch', 'deploy');
const PORT = Number(process.argv[2] || 8766);
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

// Vercel source patterns used here are path-to-regexp style; "/(.*)" is the only form we need.
const rules = (config.headers || []).map((r) => ({ re: new RegExp('^' + r.source.replace(/\//g, '\\/') + '$'), headers: r.headers }));

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(ROOT, clean);
  if (!base.startsWith(ROOT)) return null;
  const tries = clean.endsWith('/') ? [path.join(base, 'index.html')] : [base, base + '.html', path.join(base, 'index.html')];
  return tries.find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
}

http.createServer((req, res) => {
  const urlPath = new URL(req.url, 'http://localhost').pathname;
  for (const r of rules) if (r.re.test(urlPath)) r.headers.forEach((h) => res.setHeader(h.key, h.value));
  const file = resolve(urlPath);
  if (!file) { res.statusCode = 404; res.end('Not found'); return; }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
