// Computer-vs-computer test matches in the game's test mode (?simtest), several at once, for comparing AI changes.
//
//   node tools/ai-match.js --races orc,human,skaven --n 8 --new all --old rr,blitz --par 4 [--out results.jsonl]
//   node tools/ai-match.js --pairs human:orc,dwarf:skaven --n 4
//
// --races  mirror matches (each race against itself); --pairs  fixed match-ups. --n matches per race or pair.
// --new / --old  which AI improvements (the AIX switches in index.html) each side has: 'all' (as in play), 'none',
//                or a comma list. With the same setting on both sides it just plays matches (e.g. to read the stats).
// The new AI takes the home side in even-numbered matches and the away side in odd ones, so kick-off order evens out.
// Needs Playwright (with Chromium). Serves index.html itself, so no web server is needed.
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 4), PAR = +arg('par', 4), NEW = arg('new', 'all'), OLD = arg('old', 'all'), OUT = arg('out', null), LIMIT = +arg('limit', 240) * 1000;
const jobs = [];
(arg('races', '') ? arg('races').split(',') : []).forEach(r => { for (let i = 0; i < N; i++) jobs.push({ a: r, b: r, i }); });
(arg('pairs', '') ? arg('pairs').split(',') : []).forEach(pr => { const [a, b] = pr.split(':'); for (let i = 0; i < N; i++) jobs.push({ a, b, i }); });
if (!jobs.length) { console.error('Give --races or --pairs (see the top of this file).'); process.exit(1); }
const flags = f => f === 'all' ? null : f === 'none' ? [] : f.split(',');

const ROOT = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.md') ? 'text/markdown' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

async function play(browser, port, job) {
  const newHome = job.i % 2 === 0, f0 = newHome ? NEW : OLD, f1 = newHome ? OLD : NEW;
  const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } }), p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {} });
  await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));   // styling only; keeps the run offline
  await p.goto(`http://localhost:${port}/index.html?simtest`);
  const t0 = Date.now();
  await p.evaluate(([a, b, f0, f1]) => { AIX.flags[0] = f0; AIX.flags[1] = f1; AI.set(0, true); AI.set(1, true); window.launchMatch(a, b, { replaceOk: true }); }, [job.a, job.b, flags(f0), flags(f1)]);
  let res = null, clicked = false;
  while (Date.now() - t0 < LIMIT) {
    await p.waitForTimeout(250);
    if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; });
    res = await p.evaluate(() => ({ over: !!state.isGameOver, half: state.half, turn: [state.turn[0], state.turn[1]], score: [state.score[0], state.score[1]],
      cas: [0, 1].map(t => state.players.filter(q => q.team !== t && q.isCasualty).length) }));
    if (res.over) break;
  }
  await ctx.close();
  const n = newHome ? 0 : 1;
  return { ...job, newSide: newHome ? 'home' : 'away', secs: +((Date.now() - t0) / 1000).toFixed(1), ...res,
    newTD: res.score[n], oldTD: res.score[1 - n], newCas: res.cas[n], oldCas: res.cas[1 - n], errs: errs.slice(0, 3) };
}

// two-sided binomial test: how likely a split at least this uneven is if both sides were equally good
function luck(k, n) {
  if (!n) return 1;
  const lo = Math.min(k, n - k); let p = 0, c = 1;
  for (let i = 0; i <= n; i++) { if (i > 0) c = c * (n - i + 1) / i; if (i <= lo) p += c; }
  return Math.min(1, 2 * p / Math.pow(2, n));
}

server.listen(0, async () => {
  const port = server.address().port, results = [], t0 = Date.now(), queue = jobs.slice();
  const out = OUT ? fs.createWriteStream(OUT) : null;
  const worker = async () => {
    const browser = await chromium.launch();
    for (let job; (job = queue.shift());) {
      let r; try { r = await play(browser, port, job); } catch (e) { r = { ...job, over: false, errs: [String(e)] }; }
      results.push(r); if (out) out.write(JSON.stringify(r) + '\n');
      console.log(`${String(results.length).padStart(3)}/${jobs.length} ${job.a} v ${job.b}: new ${r.newTD ?? '?'} - ${r.oldTD ?? '?'} old (new ${r.newSide}, ${r.secs}s)${r.over ? '' : ' UNFINISHED'}${r.errs && r.errs.length ? ' ERR ' + r.errs[0] : ''}`);
    }
    await browser.close();
  };
  await Promise.all(Array.from({ length: Math.min(PAR, jobs.length) }, worker));
  server.close(); if (out) out.end();
  const done = results.filter(r => r.over), sum = k => done.reduce((a, r) => a + (r[k] || 0), 0);
  const nt = sum('newTD'), ot = sum('oldTD'), w = done.filter(r => r.newTD > r.oldTD).length, l = done.filter(r => r.newTD < r.oldTD).length;
  console.log(`\n${done.length} matches finished (${results.length - done.length} not), ${results.filter(r => r.errs && r.errs.length).length} with errors, ${((Date.now() - t0) / 1000).toFixed(0)}s in all`);
  console.log(`touchdowns  new ${nt} - ${ot} old   (chance of a split this uneven by luck: ${(100 * luck(nt, nt + ot)).toFixed(0)}%)`);
  console.log(`results     new won ${w}, drew ${done.length - w - l}, lost ${l}   (luck: ${(100 * luck(w, w + l)).toFixed(0)}%)`);
  console.log(`casualties  new caused ${sum('newCas')} - ${sum('oldCas')} old`);
});
