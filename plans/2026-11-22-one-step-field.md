# One-Step Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A farmer creating a field answers the field form once, right when they confirm their area, with nothing required, or looks without saving. Also: no salt reading ever shows "0,0‰".

**Architecture:** Step 1's "Đồng ý, X là khu vực của tôi. Tiếp" opens the existing field form (`openFieldForm` / `askField` in `docs/app/app.js`) when that area has no saved field. The step 2 "enter your field first" box (`renderNeedField`) is deleted. The form gets a "Xem thử, không lưu" button that sets a per-area session flag `trySite` so the planner goes on without a saved field. The dashboard's ‰ outputs go through one helper that prints "< 4‰" for a zero or missing model value, the same rule as `vn.js` `salTxt`.

**Tech Stack:** Static PWA, plain JS; Playwright phone check `tools/ui_check.js`; `python3 pipeline/test_build.py`.

**Spec:** the "Decisions (spec)" section below (agreed with the user in a question session, 2026-11-22).

## Decisions (spec)

1. **Form timing.** On step 1, tapping the next button ("Đồng ý, {area} là khu vực của tôi. Tiếp") opens the field form at once, with the area filled in, **when that area has no saved field** (and no "Xem thử" is active for it). With a saved field it goes on to step 2 as today.
2. **No step 2 block.** The "Hãy nhập ruộng của bạn trước để tiếp tục" box (`#needField`) is gone. If a farmer still reaches step 2 without a field (step bar, Plan (+)), "Tiếp" opens the form (today's `askField`), with no dead-end box.
3. **Nothing required.**
   - Name: optional. An empty name becomes "Ruộng {area short name}" (EN "Field {area short name}"); a second field in the same area becomes "Ruộng {area} 2", then 3, and so on. The default shows as the `#fName` placeholder.
   - Size: optional. An empty size saves no size, and money and water figures show "cho 1 ha" as today. A size that is typed but not valid (not a number > 0, or ≥ `MAX_HA`) still shows today's error.
   - Crops: the three season dropdowns, unchanged (defaults Lúa / Lúa / Nghỉ).
4. **Two ways on from the form.**
   - **"Lưu ruộng"** (today's submit): saves, then goes to step 2 priorities, as today (`go(2)` + `Side.sub("b")`).
   - **"Xem thử, không lưu"** / "Just look, don't save": a new button, shown only when creating, not when editing. It saves nothing and goes to step 2 "what do you grow" (`go(2)` + `Side.sub("a")`: quick picks and work force), then priorities. Cards use 1 ha.
   - "Hủy" / Cancel stays.
   - "Xem thử" holds for that area until the page reloads or the farmer saves a field there. Choosing another area and coming back asks again.
5. **Salt readings.** Every ‰ figure on the dashboard (Today card, salt tile, salt detail, month tables, gauge label) shows "< 4‰" when the model value is 0 or missing, never "0,0‰" (CLAUDE.md data rule; same as `vn.js` `salTxt`). Non-zero values show as today.
6. **One PR**, merged right away (house rule).

## Global Constraints

- Every user-facing string gets EN and VI. New strings: `fTry` ("Xem thử, không lưu" / "Just look, don't save"), `fDefault` stays "Ruộng" / "Field".
- Saved settings use the `mre-` prefix only; "Xem thử" saves nothing (a variable, not storage).
- Never show model values as measured readings; salt stays "ước tính / estimate".
- The form keeps `#fieldForm`, `#fName`, `#fArea`, `#fSize`, `#fS0`–`#fS2`, `#fCancel`; the new button is `#fTry`.
- No new files in `docs/` (`sw.js` `PRECACHE` unchanged). Bump the `sw.js` cache name to `mre-app-6`, because app files change.
- `python3 pipeline/test_build.py` (66 ok) and `node tools/ui_check.js` (all ok, exit 0) pass after every task.
- Line numbers below are from main at f4148cd; locate code by grep.

## Review Focus

1. **Typed but bad size** ("0", "abc", "5000"): the form shows today's size error and saves nothing (test in Task 1).
2. **Second field in the same area** gets "Ruộng Trần Đề 2", not a duplicate name (test in Task 1).
3. **"Xem thử" then switch area:** a different area asks for the form again, and "Xem thử" for the first area does not leak (test in Task 1).
4. **Editing an existing field** (dashboard "Sửa ruộng"): no "Xem thử" button, and the name/size rules still allow saving with the old values (test in Task 1).
5. **English:** the form, the default name ("Field Trần Đề") and "< 4‰" render in English (tests in Tasks 1 and 2).

## File structure

- `docs/app/app.js`: `nextStep`, `hasField`, `askField`, `submitField`, `openFieldForm` (both the in-page form and the fallback HTML form), `renderNeedField` (deleted) and its callers, the `[data-needfield]` click, a new `#fTry` click, and strings.
- `docs/index.html:203`: `#fTry` in `.f-actions`.
- `docs/app/strings.js`: `fTry`.
- `docs/app/dash.js`: one ‰ helper and its call sites.
- `docs/sw.js`: cache name.
- `tools/ui_check.js`: `toCards` updated; new checks `create`, `try`, `salt-text`.
- `plans/2026-11-21-handoff.md`: one line.

---

### Task 1: Field form on step 1, nothing required, "Xem thử"

**Files:**
- Modify: `docs/app/app.js:1136-1141` (`hasField`), `:1151-1154` (`askField`), `:1160-1169` (delete `renderNeedField` and every call), `:1170-1172` (`nextStep`), `:1006-1040` (`openFieldForm`: placeholder, `#fTry` hidden when editing, and in the fallback form HTML), `:1041-1056` (`submitField`), `:1131` (next-button label), `:1454` (`[data-needfield]` click; delete), plus a new `#fTry` click next to `#fCancel` (`:1399`), and the `needField`/`needFieldP`/`needName` strings at `:4-5` if unused after this task (delete them; `needFieldB` stays only if the label at `:1131` still uses it)
- Modify: `docs/index.html:203`, `docs/app/strings.js` (`fTry` EN/VI)
- Modify: `tools/ui_check.js` (`toCards`, new checks)

**Interfaces:**
- Produces: `let trySite = null` (module variable in app.js): the site id the farmer chose "Xem thử" for. `hasField()` returns true when `trySite === site.id`. Set by the `#fTry` click; cleared (`null`) when a field is saved for that site. Reloading clears it because it is never saved.
- Produces: `defaultName(siteId: string) -> string`, which returns `${t("fDefault")} ${shortName(site)}` with ` ${n}` added when n ≥ 2, where n = (saved fields in that site) + 1. Used for the `#fName` placeholder and for an empty name in `submitField`.
- Produces: `toCards(page, url)` in `tools/ui_check.js`, which now does: home → `.dv-welcome [data-dv=add]` → `.sg-pin` nth 1 → `#dNext` once → `#fieldForm` visible → fill name/size → submit → `#v3.on`. Later checks keep using it.

- [ ] **Step 1: Write the failing checks in `tools/ui_check.js`**

```js
// check "create": the form opens on the step 1 tap; nothing required; default names; no gate box
await home(page, url); await page.locator('.dv-welcome [data-dv=add]').click();
await page.locator('.sg-pin').nth(1).click();                          // Trần Đề
await page.locator('#dNext').click();
await page.waitForSelector('#fieldForm', { state: 'visible' });
assert(await page.locator('#needField').count() === 0, 'gate box still there');
assert((await page.getAttribute('#fName', 'placeholder')) === 'Ruộng Trần Đề');
await page.locator('#fieldForm [type=submit]').click();                // everything empty
let farm = await page.evaluate(() => JSON.parse(localStorage.getItem('mre-farm')));
assert(farm.fields.length === 1 && farm.fields[0].name === 'Ruộng Trần Đề' && !farm.fields[0].size);
assert(await page.locator('#v2.on').isVisible());                      // on to priorities
for (const bad of ['0', 'abc', '5000']) { /* open a new field form for Trần Đề (App.openFieldForm('tran_de')), type bad size, submit */
  /* assert: .f-err visible, field count unchanged */ }
/* open App.openFieldForm('tran_de'), submit empty: second field name === 'Ruộng Trần Đề 2' */
/* edit form (App.openFieldForm via [data-edit] or openFieldForm(null, field)): #fTry hidden; submit keeps name */
// check "try": new context; home → add → pin nth 1 → #dNext → click #fTry
//   → no field saved (mre-farm fields empty or missing), #growNow visible (step 2 "what do you grow"),
//   → #dNext until #v3.on: cards show, first .cs-box header contains "1 ha"
//   → choose another area (App.choose or tap .sg-pin nth 2, then #dNext on step 1): #fieldForm opens again
// english: in "create", after clicking #lEn before opening the form, placeholder === 'Field Trần Đề' and #fTry text === "Just look, don't save"
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tools/ui_check.js`
Expected: `FAIL create` (no form after one `#dNext`, or the `#needField` box exists), exit 1. Earlier checks may also fail because `toCards` is not updated yet.

- [ ] **Step 3: Implement**

- `nextStep` step 1: `if (site && !exOn) { if (!hasField()) return askField(); go(2) }` (keep the `else` branch).
- `askField` no longer needs the `.f-need` note (delete it).
- `submitField`: drop the name-required check. A size that is typed must be valid; an empty size saves `size: undefined`. The default name is `defaultName(site id)`. On save, clear `trySite`.
- `#fTry` click: `trySite = site.id; pendingNext = false; closeModal(); go(2); Side.sub("a")` (guard `Side` as at `:1055`).
- `#fTry` is hidden (`hidden` attribute) when `openFieldForm` is called with `edit`.
- Update `toCards` as in Interfaces; keep the refill loop only if still needed.

- [ ] **Step 4: Run to verify it passes**

Run: `node tools/ui_check.js && python3 pipeline/test_build.py | grep -c ^ok`
Expected: every check `ok` (create, try and the earlier nine), exit 0; 66.

- [ ] **Step 5: Commit** (message "Field form on the step 1 tap; nothing required; Xem thử without saving", plus the session attribution lines)

---

### Task 2: "< 4‰" instead of "0,0‰", cache bump, handoff

**Files:**
- Modify: `docs/app/dash.js:294` (gauge `aria-label`), `:352`, `:427`, `:429` (river and field columns), `:458`, `:965`, `:1129`
- Modify: `docs/sw.js:8` (`mre-app-5` → `mre-app-6`)
- Modify: `plans/2026-11-21-handoff.md` (one line under Done: "One-step field (PR #34): …")
- Modify: `tools/ui_check.js` (new check `salt-text`)

**Interfaces:**
- Produces: `ppt(g: number) -> string` in `docs/app/dash.js` (next to `fieldSalt`/`riverSalt`, `:181`). It returns `"< 4‰"` when `!(g > 0)`, else `nf(g, 1) + "‰"`. Every listed call site uses it instead of `nf(…, 1)` + "‰"; where a call site wraps "‰" in `<small>`, keep that markup around the unit for non-zero values.

- [ ] **Step 1: Write the failing check `salt-text`**

```js
// home → .dv-welcome [data-dv=demo] (sample field, Mỹ Xuyên, November = outside salt months)
const txt = await page.evaluate(() => document.body.innerText);
assert(!/\b0[,.]0\s*‰/.test(txt), 'a 0,0‰ reading is shown');
assert(txt.includes('< 4‰'), 'no "< 4‰" shown for a month outside salt months');
// open the salt detail (tap the salt card / tile that opens the zoom with monthTable) and repeat both asserts on its text
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tools/ui_check.js`
Expected: `FAIL salt-text: a 0,0‰ reading is shown`, exit 1.

- [ ] **Step 3: Implement `ppt` and use it at every listed site; bump `sw.js`; add the handoff line**

- [ ] **Step 4: Run everything**

Run: `node tools/ui_check.js; python3 pipeline/test_build.py | grep -c ^ok; node tools/shot.js index.html shots`
Expected: every check `ok`, exit 0; 66; shot.js "no errors" (desktop and phone).

- [ ] **Step 5: Commit** (message "Salt readings say '< 4‰', never '0,0‰'; cache mre-app-6"), then push the `claude/*` branch, open the draft PR, mark it ready and merge with the full head SHA (house rule).
