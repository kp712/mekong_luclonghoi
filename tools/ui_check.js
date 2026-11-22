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
  await page.locator('#dNext').click();   // step 1 "this is my area" opens the field form when the area has no field
  await page.waitForSelector('#fieldForm', { state: 'visible' });
  // The form can re-draw between two fills and send text to the wrong input: fill until both values stick.
  for (let i = 0; i < 5; i++) {
    await page.fill('#fName', 'Ruộng thử'); await page.fill('#fSize', '1,5');
    if (await page.inputValue('#fName') === 'Ruộng thử' && await page.inputValue('#fSize') === '1,5') break;
  }
  await page.locator('#fieldForm [type=submit]').click();
  for (let i = 0; i < 4 && !(await page.locator('#v3.on').count()); i++) { await page.locator('#dNext').click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(300); } // #dNext hides once step 3 is on: a short timeout, not 30 s
  await page.waitForSelector('#v3.on');
}
const toStep = async (page, n) => {
  if (await page.locator('body.dv-on').count()) { await page.locator('.nv-b', { hasText: 'Ruộng' }).click(); await page.locator('[data-dv=editmap]').first().click(); } // after a reload the dashboard shows: "edit on the map" opens the planner
  const b = page.locator(`[data-go="${n}"]:visible`);
  if (await b.count()) await b.first().click(); else await page.evaluate(n => App.go(n), n);
  await page.waitForSelector(`#v${n}.on`);
};

// Click a fold's summary, then wait until mre-folds says "area" is open/closed (no fixed sleep).
async function flip(page, f, want) {
  const s = f.locator(':scope > summary'); await s.waitFor({ state: 'visible' }); await s.click();
  await page.waitForFunction(w => { try { return !!(JSON.parse(localStorage.getItem('mre-folds')) || {}).area === (w === 'open') } catch (e) { return false } }, want);
}

const CHECKS = [
  { name: 'folds', async run({ page, url }) {
    await toCards(page, url); await toStep(page, 1);
    const f = page.locator('#v1 details.fold[data-fold="area"]');
    assert(await f.count() === 1 && !(await f.evaluate(d => d.open)), 'area fold missing or open');
    assert(await f.locator('#areaMore').count() === 1, '#areaMore not in the fold');
    assert(await f.locator('#areaFull').count() === 1 && await f.locator('#d5W1').count() === 1, '#areaFull / #d5W1 not in the fold');
    await flip(page, f, 'open'); await page.reload(); await toStep(page, 1);
    assert(await f.evaluate(d => d.open), 'open state not remembered');
    await flip(page, f, 'closed'); await page.reload(); await toStep(page, 1);
    assert(!(await f.evaluate(d => d.open)), 'closed state not remembered');
  } },
  { name: 'cards', async run({ page, url }) {
    await toCards(page, url);
    assert(await page.locator('.cmp-btn, #compare').count() === 0, 'Compare still there');
    const cards = page.locator('#cards .card:visible');
    assert(await cards.count() === 4, 'want best 3 + current, got ' + await cards.count());
    assert(await page.locator('#cards .card.isnow').isVisible(), 'current rotation hidden');
    const fold = cards.first().locator('details.fold[data-fold="card"]');
    assert(await fold.count() === 1 && !(await fold.evaluate(d => d.open)), 'card fold missing or open');
    assert(await fold.locator('.subs li').count() === 5, 'sub-scores not in the fold');
    assert(await fold.locator('.cs-mach, .cs-src').count() >= 1, 'cost extras not in the fold');
    assert(await cards.first().locator('.rw15').isVisible(), 'fit word not on the face');
    assert(await cards.first().locator('.cs-cell:visible').count() === 2, 'face needs cost and profit only');
    assert(await cards.first().locator('.vs-now').isVisible(), 'vs-now line missing');
    assert(await cards.first().locator('.dots:visible').count() === 0, 'score dots on the card face');
    await fold.locator('summary').click(); await page.waitForTimeout(200);
    await page.evaluate(() => App.refresh()); await page.waitForTimeout(300);
    assert(await page.locator('#cards .card:visible details.fold[data-fold="card"][open]').count() === 4, 'open state not shared by all cards');
  } },
  { name: 'steps', async run({ page, url }) {
    await toCards(page, url); await toStep(page, 1);
    assert(await page.locator('#modeSeg').isVisible(), '#modeSeg hidden on step 1');
    assert(await page.locator('#v1 #areaFold .nasa8').count() === 1 && await page.locator('#v1 #areaFold p.scale3[data-t]').count() === 1, '.nasa8 / .scale3 not in the area fold');
    await toStep(page, 2); await page.evaluate(() => Side.sub && Side.sub('b')); await page.waitForTimeout(200);
    assert(await page.locator('#sliders').isVisible(), '#sliders hidden');
    assert(await page.locator('#howText').isVisible() && await page.locator('#wDef').isVisible(), '#howText / #wDef hidden on step 2');
    assert(await page.locator('#v2 details.fold[data-fold="checks"]').count() >= 1, 'checks fold missing');
    await toStep(page, 4);
    for (const s of ['#s4', '#d5Cost']) assert(await page.locator(s).isVisible(), s + ' hidden');
    const pf = page.locator('#planFold');
    assert(await pf.count() === 1 && !(await pf.evaluate(d => d.open)), '#planFold missing or open');
    for (const s of ['#calendar', '#needs', '#d5W4', '#d5Pred', '#planView', '#stripKey', '.pv-list']) assert(await pf.locator(s).count() >= 1, s + ' not in #planFold');
    assert(await page.locator('#planOk .po-where, #planOk .po-cal, #planOk .po-next').count() === 0, 'po-where/cal/next still rendered');
    const mf = page.locator('#season details.fold[data-fold="month"]');
    assert(await mf.count() === 1 && await mf.locator('#wk').count() === 1, '#wk not in the month fold');
    await page.locator('#ppRev').click(); await page.waitForSelector('.pp-score');
    assert(await page.locator('.pp-score .pp-num').evaluate(e => !!e.closest('details.fold')), '.pp-num not in a fold');
    assert(await page.locator('.pp-word').isVisible() && await page.locator('.pp-say').isVisible(), 'pp-word / pp-say hidden');
  } },
  { name: 'width', async run({ page, url }) {
    await toCards(page, url);
    for (const n of [1, 2, 3, 4]) {
      await toStep(page, n);
      await page.evaluate(() => document.querySelectorAll('details.fold').forEach(d => { d.open = true }));
      await page.waitForTimeout(250);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sideways scroll on step ' + n);
    }
  } },
  { name: 'print', async run({ page, url }) {
    await toCards(page, url); await toStep(page, 4);
    await page.evaluate(() => { document.querySelector('#planFold').open = false });
    const html = await page.evaluate(() => App.planDoc());
    assert(html.includes('class="calendar"') && html.includes('class="needs"'), 'calendar / needs missing from the print');
    assert(html.includes('id="d5W4"'), 'wheel missing from the print');
    assert(!html.includes('id="timeline"') && !html.includes('id="strip"'), 'calendar view prints the list too');
    const doc = await page.context().newPage();
    await doc.setContent(html); await doc.waitForLoadState('load');
    assert(await doc.evaluate(() => [...document.querySelectorAll('.cite, .src, .s-src')].some(e => e.offsetHeight > 0)), 'no visible source in the printed copy');
    await doc.close();
    await page.evaluate(() => document.querySelector('#planView [data-pv=list]').click());
    const list = await page.evaluate(() => App.planDoc());
    assert(list.includes('id="timeline"') && list.includes('id="strip"') && list.includes('id="stripKey"') && !list.includes('id="calendar"'), 'list view should print the strip, its key and the list, not the calendar');
  } },
  { name: 'dash', async run({ page, url }) {
    await toCards(page, url); await page.reload(); await page.waitForSelector('body.dv-on');
    await page.locator('#hubBtn').waitFor({ state: 'visible', timeout: 5000 }).catch(() => { throw new Error('#hubBtn hidden') }); // mentor.js adds it after load
    assert(/‰/.test(await page.locator('.s-word').first().textContent()), 'no small ‰ next to the salt word');
    assert(await page.locator('[data-dvmode], #uiSeg, #uSimple, #uiPick').count() === 0, 'mode switch still there');
  } },
  { name: 'old-data', async run({ page, url, errs }) {
    await page.addInitScript(() => { try { localStorage.setItem('mre-ui', 'advanced'); localStorage.setItem('mre-farm', JSON.stringify({ fields: [], sel: null, ui: 'advanced' })); } catch (e) {} });
    await toCards(page, url);
    assert(await page.locator('body.ui-advanced, body.dv-adv').count() === 0, 'old mode class on body');
    assert(await page.locator('#cards .card:visible').count() === 4, 'step 3 should show 4 cards');
    assert(!errs.length, 'page errors: ' + errs.join(' | '));
  } },
  { name: 'english', async run({ page, url }) {
    await toCards(page, url); await page.locator('#lEn').click();
    for (const n of [1, 2, 3, 4]) {
      await toStep(page, n);
      const s = await page.evaluate(() => [...document.querySelectorAll('details.fold > summary')].map(x => x.textContent.trim()));
      assert(s.length && s.every(x => x && !/undefined/.test(x)), 'bad fold summary on step ' + n + ': ' + JSON.stringify(s));
    }
    assert(!/undefined/.test(await page.evaluate(() => document.body.innerText)), 'undefined in the page text');
  } },
  { name: 'create', async run({ page, url }) {
    const farm = () => page.evaluate(() => (JSON.parse(localStorage.getItem('mre-farm') || 'null') || { fields: [] }).fields);
    const form = async () => { await page.evaluate(() => App.openFieldForm('tran_de')); await page.waitForSelector('#fieldForm', { state: 'visible' }); };
    await home(page, url); await page.locator('.dv-welcome [data-dv=add]').click();
    await page.locator('.sg-pin').nth(1).click(); await page.waitForSelector('#v1.on');
    await page.locator('#dNext').click();
    await page.waitForSelector('#fieldForm', { state: 'visible', timeout: 3000 });
    assert(await page.locator('#needField').count() === 0, 'step 2 gate box still there');
    assert(await page.getAttribute('#fName', 'placeholder') === 'Ruộng Trần Đề', 'placeholder: ' + await page.getAttribute('#fName', 'placeholder'));
    assert(await page.locator('#fTry').isVisible(), 'no Xem thử button');
    await page.locator('#fieldForm [type=submit]').click();               // everything empty
    await page.waitForSelector('#v2.on');
    let fs = await farm();
    assert(fs.length === 1 && fs[0].name === 'Ruộng Trần Đề' && !fs[0].size, 'empty form saved as ' + JSON.stringify(fs));
    for (const bad of ['0', 'abc', '5000']) {
      await form(); assert(!(await page.locator('#fTry').isVisible()), 'Xem thử in a form opened on purpose');
      await page.fill('#fSize', bad); await page.locator('#fieldForm [type=submit]').click();
      assert(await page.locator('#fieldForm .f-err').isVisible(), 'no error for size ' + bad);
      assert((await farm()).length === 1, 'saved with size ' + bad);
      await page.locator('#fCancel').click();
    }
    await form(); await page.locator('#fieldForm [type=submit]').click();
    fs = await farm(); assert(fs.length === 2 && fs[1].name === 'Ruộng Trần Đề 2', 'second name ' + JSON.stringify(fs.map(f => f.name)));
    await page.evaluate(id => { const f = JSON.parse(localStorage.getItem('mre-farm')); f.fields.find(x => x.id === id).size = 1.5; localStorage.setItem('mre-farm', JSON.stringify(f)); Farm.st.fields.find(x => x.id === id).size = 1.5; }, fs[0].id);
    await page.evaluate(id => App.openField(id), fs[1].id);
    assert(await page.evaluate(() => Cost.ha()) == null, 'sizeless field borrows another field\'s hectares: ' + await page.evaluate(() => Cost.ha()));
    await page.evaluate(id => document.querySelector(`[data-edit="${id}"]`).click(), fs[0].id);  // edit the first field
    await page.waitForSelector('#fieldForm', { state: 'visible' });
    assert(!(await page.locator('#fTry').isVisible()), 'Xem thử shown when editing');
    await page.locator('#fieldForm [type=submit]').click();
    fs = await farm(); assert(fs.length === 2 && fs[0].name === 'Ruộng Trần Đề', 'edit changed the name: ' + fs[0].name);
  } },
  { name: 'create-en', async run({ page, url }) {
    await home(page, url); await page.locator('#lEn').click(); await page.locator('.dv-welcome [data-dv=add]').click();
    await page.locator('.sg-pin').nth(1).click(); await page.waitForSelector('#v1.on');
    await page.locator('#dNext').click(); await page.waitForSelector('#fieldForm', { state: 'visible', timeout: 3000 });
    assert(await page.getAttribute('#fName', 'placeholder') === 'Field Trần Đề', 'EN placeholder: ' + await page.getAttribute('#fName', 'placeholder'));
    assert((await page.locator('#fTry').textContent()).trim() === "Just look, don't save", 'EN Xem thử label');
  } },
  { name: 'form-320', async run({ page, url }) {
    await page.setViewportSize({ width: 320, height: 640 });
    await home(page, url); await page.locator('.dv-welcome [data-dv=add]').click();
    await page.locator('.sg-pin .sg-pin-btn').nth(1).evaluate(b => b.click()); await page.waitForSelector('#v1.on');
    await page.locator('#dNext').click(); await page.waitForSelector('#fieldForm', { state: 'visible', timeout: 3000 });
    for (const b of await page.locator('#fieldForm .f-actions button:visible').all()) {
      const r = await b.boundingBox(); assert(r && r.x >= 0 && r.x + r.width <= 320, 'off screen at 320 px: ' + (await b.textContent()).trim());
    }
  } },
  { name: 'try', async run({ page, url }) {
    await home(page, url); await page.locator('.dv-welcome [data-dv=add]').click();
    await page.locator('.sg-pin').nth(1).click(); await page.waitForSelector('#v1.on');
    await page.locator('#dNext').click(); await page.waitForSelector('#fieldForm', { state: 'visible', timeout: 3000 });
    await page.locator('#fTry').click();
    await page.waitForSelector('#v2.on');
    assert(await page.locator('#growNow').isVisible(), 'Xem thử should land on "what do you grow"');
    assert(await page.evaluate(() => (JSON.parse(localStorage.getItem('mre-farm') || 'null') || { fields: [] }).fields.length) === 0, 'Xem thử saved a field');
    for (let i = 0; i < 4 && !(await page.locator('#v3.on').count()); i++) { await page.locator('#dNext').click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(300); }
    await page.waitForSelector('#v3.on');
    assert(/1 ha/.test(await page.locator('#cards .card:visible .cs-h').first().textContent()), 'cards not per 1 ha');
    const again = async (n) => { await page.locator('#dClose').click(); await page.locator('.sg-pin .sg-pin-btn').nth(n).evaluate(b => b.click());   // the map zooms to the chosen area, so a pin can be off screen await page.waitForSelector('#v1.on');
      await page.locator('#dNext').click(); await page.waitForSelector('#fieldForm', { state: 'visible', timeout: 3000 }); await page.locator('#fCancel').click(); };
    await again(2);   // another area asks again
    await again(1);   // and back on the first area too
  } },
  { name: 'salt-text', async run({ page, url }) {
    // sample field (Mỹ Xuyên): November is outside the salt months, so the model gives 0: show "< 4‰", never "0,0‰"
    const check = async (where) => { const txt = await page.evaluate(() => document.body.innerText);
      assert(!/(^|[^\d])0[,.]0\s*‰/.test(txt), 'a 0,0‰ reading on ' + where);
      assert(txt.includes('< 4‰'), 'no "< 4‰" on ' + where); };
    await home(page, url); await page.locator('.dv-welcome [data-dv=demo]').click(); await page.waitForSelector('.s-salt');
    await check('Today');
    await page.locator('.nv-b', { hasText: 'Số liệu' }).click(); await page.locator('[data-zoomb="salt"]').first().click();
    await page.waitForSelector('#dvZoom:not([hidden])'); await check('the salt detail');
  } },
  { name: 'folds-no-storage', async run({ page, url, errs }) {
    await page.addInitScript(() => { const boom = () => { throw new Error('blocked') }; Storage.prototype.getItem = boom; Storage.prototype.setItem = boom; });
    await home(page, url);
    await page.locator('.dv-welcome [data-dv=add]').click();
    await page.locator('.sg-pin').nth(1).click();
    await page.waitForSelector('#v1.on');
    const f = page.locator('#v1 details.fold[data-fold="area"]');
    assert(await f.count() === 1 && !(await f.evaluate(d => d.open)), 'area fold missing or open');
    await f.locator(':scope > summary').click(); await page.waitForTimeout(200);
    assert(!errs.length, 'page errors: ' + errs.join(' | '));
  } },
];

server.listen(0, async () => {
  const url = `http://localhost:${server.address().port}/index.html`;
  const b = await chromium.launch(); let bad = 0;
  const only = process.argv.slice(2);   // node tools/ui_check.js create try: run only those checks
  for (const c of CHECKS.filter(c => !only.length || only.includes(c.name))) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), errs = [];
    await ctx.addInitScript(() => { try { localStorage.setItem('mre-onb1', '1'); localStorage.setItem('mre-onb2', '1'); } catch (e) {} });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
    try { await c.run({ page, url, errs }); if (errs.length) throw new Error('page errors: ' + errs.join(' | ')); console.log('ok ' + c.name); }
    catch (e) { bad++; console.log(`FAIL ${c.name}: ${e.message.split('\n').slice(0, 4).join(' | ')}`); }
    await ctx.close();
  }
  await b.close(); server.close(); process.exit(bad ? 1 : 0);
});
