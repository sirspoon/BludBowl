// How often does the AI use its players' special actions in BludBowl itself? Plays computer-v-computer mirror matches in jsdom
// (like tools/headless-match.js) and counts each special-action button the AI presses (both sides are the AI).
//   node tools/ai-special-actions.js vampire goblin darkelf --n 2
const { openGame } = require('./headless-match.js');
const argv = process.argv.slice(2), N = argv.includes('--n') ? +argv[argv.indexOf('--n') + 1] : 2;
const races = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--n');
const BTN = ['vomit', 'gaze', 'bnc', 'bomb', 'chainsaw', 'ktm', 'stab', 'ttm', 'leap', 'jump', 'breathe', 'fire', 'pogo', 'swoop', 'hail'];

async function one(race) {
  const { window: w } = await openGame();
  w.eval(`window.__sa = {}; document.querySelectorAll('[id^="btn-action-"]').forEach(b => {
      const k = b.id.slice(11); let f = b.onclick;
      Object.defineProperty(b, 'onclick', { configurable: true, get() { return f && function () { window.__sa[k] = (window.__sa[k] || 0) + 1; return f.apply(this, arguments); }; }, set(v) { f = v; } });
    });
    AI.set(0, true); AI.set(1, true); window.launchMatch(${JSON.stringify(race)}, ${JSON.stringify(race)}, { replaceOk: true });`);
  const t0 = Date.now();
  return new Promise(res => {
    const iv = setInterval(() => {
      const o = JSON.parse(w.eval(`(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && !b.closest('.hidden')) b.click();
        return JSON.stringify({ over: !!state.isGameOver, sa: window.__sa, score: state.score }); })()`));
      if (o.over || Date.now() - t0 > 300000) { clearInterval(iv); w.close(); res(o); }
    }, 500);
  });
}

(async () => {
  for (const r of races) {
    const tot = {}; let done = 0;
    const out = await Promise.all(Array.from({ length: N }, () => one(r)));
    out.forEach(o => { if (o.over) done++; Object.entries(o.sa).forEach(([k, v]) => { tot[k] = (tot[k] || 0) + v; }); });
    const special = Object.fromEntries(Object.entries(tot).filter(([k]) => BTN.some(b => k.includes(b))));
    console.log(`${r} (${N} matches, ${done} finished): special actions pressed ${JSON.stringify(special)}   | all buttons ${JSON.stringify(tot)}`);
  }
  process.exit(0);
})();
