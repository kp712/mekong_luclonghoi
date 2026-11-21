/* learn.js (Draft 7): on-device learning for the farmer feedback loop.
   What it learns: how far the app's salt-loss forecast is off for a given area, from reports of real harvests.
   Model: ridge regression (Bayesian prior) of  reported loss  on  [1, forecast, area]. The prior says
   "the forecast is right" (intercept 0, slope 1, no area shift) and counts as PRIOR_N pseudo-reports, so a few
   reports barely move it and many reports can. It never replaces the forecast with a guess: below MIN_N reports
   it only shows "not enough reports yet".
   A second, simpler count (Beta posterior) tracks how often a rotation "worked for me" per area.
   Everything runs in the browser and is stored in localStorage; reports can be exported and merged by copy/paste
   so a team can pool them and refit (there is no server). Loss values are fractions 0..1 in the maths. */
const Learn = (() => {
  const KEY = "mre-reports";
  const PRIOR_N = 4, MIN_N = 5, SD0 = 0.15, LAM_AREA = 6;
  const LOSS = { none: 0, little: 0.1, some: 0.3, most: 0.6 };   /* answers -> reported loss; a typed % overrides */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  };
  let mem = null;
  const all = () => (mem || (mem = store.get()));
  const save = (r) => { mem = r; store.set(r); };

  /* Gaussian elimination for small systems */
  function solve(A, b) {
    const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c] || 1e-9;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((r, i) => r[n] / (r[i] || 1e-9));
  }
  const rec = (x) => ({ x, x });

  /* reports -> fitted model. Report fields used: area, pred (forecast loss %, 0..100), loss (reported loss %, 0..100) */
  function fit(reports) {
    const rs = (reports || all()).filter((r) => r.area && isFinite(r.pred) && isFinite(r.loss));
    const areas = [...new Set(rs.map((r) => r.area))];
    const dim = 2 + areas.length;
    const lam = [PRIOR_N * 2, PRIOR_N, ...areas.map(() => LAM_AREA)];   /* intercept moves least: forecast bias is a slope story first */
    const w0 = [0, 1, ...areas.map(() => 0)];
    const row = (r) => { const x = Array(dim).fill(0); x[0] = 1; x[1] = clamp(r.pred / 100); const i = areas.indexOf(r.area); if (i >= 0) x[2 + i] = 1; return x; };
    const A = Array.from({ length: dim }, (_, i) => Array.from({ length: dim }, (_, j) => (i === j ? lam[i] : 0)));
    const b = lam.map((l, i) => l * w0[i]);
    rs.forEach((r) => { const x = row(r), y = clamp(r.loss / 100); for (let i = 0; i < dim; i++) { b[i] += x[i] * y; for (let j = 0; j < dim; j++) A[i][j] += x[i] * x[j]; } });
    const w = solve(A, b);
    let sse = 0; rs.forEach((r) => { const x = row(r), e = clamp(r.loss / 100) - x.reduce((s, v, i) => s + v * w[i], 0); sse += e * e; });
    const sd = Math.sqrt((PRIOR_N * SD0 * SD0 + sse) / (PRIOR_N + rs.length));
    return { w, areas, n: rs.length, sd, A, row, dim };
  }
  /* forecast (0..100) + area -> adjusted loss with a rough 80% range */
  function adjust(pred, area, model) {
    const m = model || fit();
    const x = m.row({ pred, area }), mean = clamp(x.reduce((s, v, i) => s + v * m.w[i], 0));
    const v = solve(m.A, x).reduce((s, t, i) => s + t * x[i], 0);               /* x' A^-1 x */
    const half = 1.28 * m.sd * Math.sqrt(1 + Math.max(0, v));
    const ready = m.n >= MIN_N;
    return { adj: Math.round(mean * 100), lo: Math.round(clamp(mean - half) * 100), hi: Math.round(clamp(mean + half) * 100),
             n: m.n, ready, shift: Math.round((mean - clamp(pred / 100)) * 100), slope: m.w[1], sd: m.sd };
  }
  /* how often a rotation worked: Beta(1,1) prior, per area + rotation */
  function worked(area, rot, reports) {
    const rs = (reports || all()).filter((r) => r.area === area && r.rot === rot && typeof r.ok === "boolean");
    const a = 1 + rs.filter((r) => r.ok).length, b = 1 + rs.filter((r) => !r.ok).length;
    return { n: rs.length, rate: a / (a + b), a, b };
  }
  function add(r) {
    const o = Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: new Date().toISOString().slice(0, 10) }, r);
    if (o.loss == null && o.lossKey in LOSS) o.loss = LOSS[o.lossKey] * 100;
    save(all().concat(o)); return o;
  }
  const remove = (id) => save(all().filter((r) => r.id !== id));
  const clear = () => save([]);
  /* export/merge: JSON in a string, deduplicated by id, no personal fields are ever stored (area, rotation, loss, notes only) */
  const exportText = () => JSON.stringify({ v: 1, reports: all().map(({ id, at, area, rot, variety, pred, loss, ok, changed, note }) => ({ id, at, area, rot, variety, pred, loss, ok, changed, note })) });
  function importText(t) {
    let j; try { j = JSON.parse(t); } catch (e) { return { added: 0, error: "format" }; }
    const have = new Set(all().map((r) => r.id)), add = (j.reports || []).filter((r) => r && r.id && !have.has(r.id) && r.area && isFinite(r.pred));
    save(all().concat(add)); return { added: add.length };
  }
  return { add, remove, clear, all, fit, adjust, worked, exportText, importText, LOSS, MIN_N, PRIOR_N };
})();
if (typeof module !== "undefined") module.exports = Learn;
