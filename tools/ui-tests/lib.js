// Shared helpers for the browser checks in tools/ui-tests (run them from the repo root: node tools/ui-tests/<name>.js [outDir]).
// They open index.html in the pre-installed Chromium with Playwright, poke the game's own modules (TB, TRULES, CUP, FREP, ...)
// and print PASS / FAIL lines. Screenshots go to outDir (default /tmp/bb-ui). The exit code is the number of failures.
const { chromium, devices } = require('playwright');
const path = require('path'), fs = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '/tmp/bb-ui';
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (ok, what, extra) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${extra != null ? '  (' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) + ')' : ''}`); return ok; };
const done = async browser => { if (browser) await browser.close(); console.log(fails ? `\n${fails} check(s) failed` : '\nall checks passed'); process.exit(fails ? 1 : 0); };

// a page with the game loaded and the splash out of the way. opts: { device: 'Pixel 7' | ..., viewport, query: '?simtest' }
async function openGame(browser, opts = {}) {
  const ctx = await browser.newContext(opts.device ? { ...devices[opts.device] } : { viewport: opts.viewport || { width: 1280, height: 900 } });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e.stack || e).slice(0, 300)));
  await page.goto('file://' + path.join(ROOT, 'index.html') + (opts.query || ''));
  await page.waitForTimeout(1300);
  await page.evaluate(() => { const s = document.getElementById('splash'); if (s) s.style.display = 'none'; });
  return { ctx, page, errors };
}
// set a <select> (they are hidden behind the game's styled menus) and fire its change event
const setSelect = (page, q, v) => page.evaluate(([q, v]) => { const e = document.querySelector(q); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, [q, v]);
const click = (page, q) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return 'missing'; e.click(); return e.disabled ? 'disabled' : 'ok'; }, q);
// save a team straight into the game's storage. spec: { id, name, race, format?, rules?, budget?, stars?, players: [[positionIndex, mp?, mp2?], ...], ... }
const putTeam = (page, spec) => page.evaluate(spec => {
  const pos = Object.keys(RACES[spec.race].positions);
  const t = Object.assign({ name: spec.id, rerolls: 2 }, spec, { players: spec.players.map(([i, mp, mp2], j) => Object.assign({ pos: pos[i], name: 'Player ' + (j + 1) }, mp ? { mp } : {}, mp2 ? { mp2 } : {}, spec.vet === j ? { vet: true } : {})) });
  TB.put(t); return t.id;
}, spec);

module.exports = { chromium, devices, ROOT, OUT, check, done, openGame, setSelect, click, putTeam };
