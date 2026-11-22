// Phone check: node tools/ui_check.js. Runs the named checks at the bottom in order, prints "ok <name>" or
// "FAIL <name>: <message>", exits 1 on any failure or page error. To add a check, add one { name, run(ctx) } entry to CHECKS.
// The static server lives inside this script (background servers get blocked in cloud sessions).
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..', 'docs');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});

const home = (page, url) => page.goto(url).then(() => page.waitForSelector('.sg-pin'));
// Home -> a new field on Trần Đề -> step 3 (step 2 may be skipped after saving, so test #v3, not click counts).
async function toCards(page, url) {
  await home(page, url);
  await page.locator('.dv-welcome [data-dv=add]').click();
  await page.locator('.sg-pin').nth(1).click();
  await page.locator('#dNext').click(); await page.locator('#dNext').click();
  await page.fill('#fName', 'Ruộng thử'); await page.fill('#fSize', '1,5');
  await page.locator('#fieldForm [type=submit]').click();
  for (let i = 0; i < 4 && !(await page.locator('#v3.on').count()); i++) { await page.locator('#dNext').click(); await page.waitForTimeout(300); }
}
const toStep = async (page, n) => {
  if (await page.locator('body.dv-on').count()) { await page.locator('.nv-b', { hasText: 'Ruộng' }).click(); await page.locator('[data-dv=editmap]').first().click(); } // after a reload the dashboard shows: "edit on the map" opens the planner
  const b = page.locator(`[data-go="${n}"]:visible`);
  if (await b.count()) await b.first().click(); else await page.evaluate(n => App.go(n), n);
  await page.waitForSelector(`#v${n}.on`);
};

const CHECKS = [
  { name: 'folds', async run({ page, url }) {
    await toCards(page, url); await toStep(page, 1);
    const f = page.locator('#v1 details.fold[data-fold="area"]');
    assert(await f.count() === 1 && !(await f.evaluate(d => d.open)), 'area fold missing or open');
    assert(await f.locator('#areaMore').count() === 1, '#areaMore not in the fold');
    await f.locator('summary').click(); await page.waitForTimeout(200); await page.reload(); await toStep(page, 1);
    assert(await f.evaluate(d => d.open), 'open state not remembered');
    await f.locator('summary').click(); await page.waitForTimeout(200); await page.reload(); await toStep(page, 1);
    assert(!(await f.evaluate(d => d.open)), 'closed state not remembered');
  } },
  { name: 'folds-no-storage', fresh: true, async run({ page, url, errs }) {
    await page.addInitScript(() => { const boom = () => { throw new Error('blocked') }; Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; });
    await home(page, url);
    await page.locator('.dv-welcome [data-dv=add]').click();
    await page.locator('.sg-pin').nth(1).click();
    await page.waitForSelector('#v1.on');
    const f = page.locator('#v1 details.fold[data-fold="area"]');
    assert(await f.count() === 1 && !(await f.evaluate(d => d.open)), 'area fold missing or open');
    await f.locator('summary').click(); await page.waitForTimeout(200);
    assert(!errs.length, 'page errors: ' + errs.join(' | '));
  } },
];

server.listen(0, async () => {
  const url = `http://localhost:${server.address().port}/index.html`;
  const b = await chromium.launch(); let bad = 0;
  for (const c of CHECKS) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), errs = [];
    await ctx.addInitScript(() => { try { localStorage.setItem('mre-onb1', '1'); localStorage.setItem('mre-onb2', '1'); } catch (e) {} });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
    try { await c.run({ page, url, errs }); if (errs.length) throw new Error('page errors: ' + errs.join(' | ')); console.log('ok ' + c.name); }
    catch (e) { bad++; console.log(`FAIL ${c.name}: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
  await b.close(); server.close(); process.exit(bad ? 1 : 0);
});
