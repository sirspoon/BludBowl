// Plays BludBowl computer-v-computer matches in test mode (?simtest) and records FUMBBL-style stats for each team:
// every dodge / rush / pick-up / pass roll (target and result), every block (dice and who picks), every turnover
// (and its cause) and every team re-roll. compare.py reads the output next to the FUMBBL data.
//
//   node ai-training/bb-stats.js --out ai-training/data/bludbowl.jsonl --n 6 --par 4
//
// --n  games per team (every team plays about n games, against random opponents); --pairs a:b,c:d  fixed match-ups instead.
// --seed  for the random pairings. Needs Playwright (with Chromium). Serves index.html itself.
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 6), PAR = +arg('par', 4), OUT = arg('out', 'bludbowl.jsonl'), LIMIT = +arg('limit', 240) * 1000;
const RACES = 'amazon blackorc bretonnian chaoschosen chaosdwarf renegades darkelf dwarf elvenunion gnome goblin halfling highelf human imperial khorne lizardmen necromantic norse nurgle ogre oldworld orc undead skaven snotling tombkings underworld vampire woodelf'.split(' ');
let seed = +arg('seed', 7); const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
let jobs = [];
if (arg('pairs')) jobs = arg('pairs').split(',').map(pr => pr.split(':'));
else {   // every team in the pool N times, shuffled, then paired off (never against itself)
  const pool = []; for (let i = 0; i < N; i++) pool.push(...RACES);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  while (pool.length > 1) { const a = pool.pop(); let j = pool.findIndex(b => b !== a); if (j < 0) j = 0; jobs.push([a, pool.splice(j, 1)[0]]); }
}
// the recorder, put into the page before the match starts: it wraps the game's own functions
const HOOK = () => {
  window.BBX = { rolls: [], blocks: [], tos: [], rr: [] };
  document.addEventListener('click', e => {
    if (!e.target || e.target.id !== 'btn-roll-confirm') return;
    const r = state.pendingRoll; if (!r || r._bbx) return; r._bbx = 1;
    const rec = { type: r.type, target: r.target, team: r.player.team, half: state.half, turn: state.turn[r.player.team] };
    const op = r.onPass, of = r.onFail;   // the final result, after any re-rolls
    r.onPass = function () { if (rec.ok == null) rec.ok = true; return op.apply(this, arguments); };
    r.onFail = function () { if (rec.ok == null) rec.ok = false; return of.apply(this, arguments); };
    BBX.rolls.push(rec);
  }, true);
  const oRB = resolveBlock;
  resolveBlock = function () { const c = state.combat; if (c && !c._bbx) { c._bbx = 1; BBX.blocks.push({ team: c.atk.team, dice: (c.dice || []).length, own: c.chooser === c.atk.team, blitz: c.atk.actionTaken === 'blitz', half: state.half }); } return oRB.apply(this, arguments); };
  const oTT = triggerTurnover;
  triggerTurnover = function (reason) { try { if (!state.isGameOver && !state.charge && !REPLAY.get()) BBX.tos.push({ team: state.activeTeam, reason, half: state.half }); } catch (e) {} return oTT.apply(this, arguments); };
  const oSR = spendTeamReroll;
  spendTeamReroll = function (team) { const vis = id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
    BBX.rr.push({ team, what: vis('modal-dice') ? 'BLOCK' : (state.pendingRoll && state.pendingRoll.type) || 'other' }); return oSR.apply(this, arguments); };
};
const ROOT = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
async function play(browser, port, [a, b]) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } }), p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {} });
  await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
  await p.goto(`http://localhost:${port}/index.html?simtest`);
  const t0 = Date.now();
  await p.evaluate(HOOK);
  await p.evaluate(([a, b]) => { AI.set(0, true); AI.set(1, true); window.launchMatch(a, b, { replaceOk: true }); }, [a, b]);
  let over = false, clicked = false;
  while (Date.now() - t0 < LIMIT) {
    await p.waitForTimeout(250);
    if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; });
    if ((over = await p.evaluate(() => !!state.isGameOver))) break;
  }
  const res = over ? await p.evaluate(() => ({ version: (document.getElementById('app-version') || {}).textContent, races: [ROSTERS[0].race || ROSTERS[0].key, ROSTERS[1].race || ROSTERS[1].key],
    score: [state.score[0], state.score[1]], cas: [0, 1].map(t => state.players.filter(q => q.team !== t && (q.team === 0 || q.team === 1) && q.isCasualty).length), ...BBX })) : { unfinished: true, races: [a, b] };
  await ctx.close(); res.secs = +((Date.now() - t0) / 1000).toFixed(1); return res;
}
server.listen(0, async () => {
  const port = server.address().port, queue = jobs.slice(), out = fs.createWriteStream(OUT, { flags: 'a' }); let n = 0;
  const worker = async () => { const browser = await chromium.launch();
    for (let job; (job = queue.shift());) { let r; try { r = await play(browser, port, job); } catch (e) { r = { unfinished: true, races: job, err: String(e) }; }
      out.write(JSON.stringify(r) + '\n'); console.log(`${String(++n).padStart(3)}/${jobs.length} ${job[0]} v ${job[1]}: ${r.unfinished ? 'UNFINISHED' : r.score.join('-')} (${r.secs}s)`); }
    await browser.close(); };
  await Promise.all(Array.from({ length: Math.min(PAR, jobs.length) }, worker));
  out.end(); server.close();
});
