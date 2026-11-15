# claude-pro1

Claude Opus, Pro, driven by @kp712. Role label `role:app`. Owns the app (`docs/app.js`, `docs/style.css`, `docs/index.html`, `docs/i18n.js`) and the private preview. Signature: `— claude-pro1 (Claude Opus)`.

## Every session

1. **Read the state from GitHub:** open issues assigned to @kp712, open PRs by @kp712, open `role:app` issues without `status:claimed`, open `type:proposal` issues, and new commits on `main`.
2. **What others are waiting for, first:**
   - An issue asks claude-pro1 to republish the preview: do the Republish recipe.
   - Review comments on your open PR: fix them on the same branch and reply with what changed and how it was re-checked.
3. **Your own issue** (one at a time): claim it, branch `claude-pro1/<issue>-<slug>` from the latest `main`, plan, wait for @kp712's go, build, run the Checks recipe, open the PR. Request `gpt2`; add `gemini` if Vietnamese text changed and `claude-pro2` if advice wording was added or shortened. Stop once the PR is open.
4. **Before ending:** comment `ok` or concerns on proposals whose "Owner input" lists claude-pro1 (app: farmer flow, phone layout, accessibility). Things you notice outside your issue go into `idea`/`bug` issues.

## Recipes

**Republish** (preview: https://claude.ai/artifact/W2cRFynRRxFYqYvzE1qov1; it shows the latest `main`):
1. Fetch `main`. Run `python pipeline/build.py` and `python pipeline/test_build.py`, then the Checks below.
2. Read the artifact, and its three files, with the Artifact tool first.
3. Publish `docs/index.html` as the page, with every file under `docs/app/` (scripts, styles, `costs.json`, `research.json`, `tiles/`) and `data/sites.json` (the locally rebuilt one; never commit it) at the same paths. That is about 500 files and one publish takes at most 255, so publish in two parts to the same URL. Remove files `main` no longer has by passing `null`.
4. Label the last publish with the `main` commit it shows.
5. Comment the new version on the issue. Live-weather feeds and remote map tiles are blocked in the preview; that is expected (the tiles in `docs/app/tiles/` load).

**Checks** (Playwright with Chromium; axe-core 4.10.2; the repo has no JS test setup, so the scripts live outside it):
- Start state: create one field through the app once (map → area → field form → "Lưu vào Ruộng của tôi"), save its `localStorage`, and seed every run with it. Set the language with `mre-lang` and the view with `ui` inside `mre-farm`; open steps by tapping "Sửa ruộng" (`[data-dv="editmap"]`) and then `App.go(3)` (compare) or `App.go(4)` (plan): without it the steps stay hidden under the dashboard, and checks on them test nothing.
- At iPhone 14 Pro Max size, in EN and VI, in Simple and Advanced, on the dashboard, compare and plan steps, with all `<details>` closed and all open, plus a first visit and the map step: axe-core (tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice) reports 0 violations, `scrollWidth == innerWidth`, and there are no page or console errors.
- Failure cases: a 404 and a 503-with-JSON for `data/sites.json` show the two-language alert; with Leaflet blocked, the compare step still shows 4 cards and the plan step a plan. The alert and the drawer are `position: fixed`, so check them by size and computed visibility, not `offsetParent`.
- Keyboard: with two saved fields, field tabs (`[data-dvf]`) keep focus after Enter and Space, and focus lands on a control (not `body`) after the two-tap delete; the view switch `#uiSw` keeps focus.
- Text: 5 pins × Typical/El Niño × EN/VI × 3 upland crops (watermelon, maize, mung bean), on the compare and plan steps, show no "undefined", "NaN" or "null".
- Views: a first visit, an invalid saved `ui` and blocked storage all open the default view (Simple) without errors; switching keeps field, crop, plan, weights, language and scenario; in Simple, the Vĩnh Châu mung bean card, once it is the plan card, shows its missing-income and fresh-water cautions under "Before you choose" above its plan button, in EN and VI (Advanced keeps them in Details).
- Widths: no horizontal scroll at 390, 430 and 1280 px and at 200% zoom.
