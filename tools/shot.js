// Screenshot the app at desktop and phone size and list page errors.
// Usage: node tools/shot.js [page, default "index.html#vietnam"] [out dir, default "shots"]
// The static server lives inside this script (background servers get blocked in cloud sessions).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..', 'docs');
const page = process.argv[2] || 'index.html#vietnam', out = process.argv[3] || 'shots';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
server.listen(0, async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); let bad = 0;
  for (const [name, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await b.newContext({ ...opts, serviceWorkers: 'block' }); // block the SW so every run sees the files on disk
    await ctx.addInitScript(() => { localStorage.setItem('mre-onb1', '1'); localStorage.setItem('mre-onb2', '1'); }); // skip onboarding
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(`http://localhost:${server.address().port}/${page}`); await p.waitForTimeout(4000);
    const file = path.join(out, `${name}.png`); await p.screenshot({ path: file });
    console.log(file, errs.length ? errs : 'no errors'); bad += errs.length;
    await ctx.close();
  }
  await b.close(); server.close(); process.exit(bad ? 1 : 0);
});
