// Computer-vs-computer test matches in the game's test mode (?simtest), several at once, for comparing AI changes.
//
//   node tools/ai-match.js --races orc,human,skaven --n 8 --new all --old rr,blitz --par 4 [--out results.jsonl]
//   node tools/ai-match.js --pairs human:orc,dwarf:skaven --n 4
//
// --races  mirror matches (each race against itself); --pairs  fixed match-ups. --n matches per race or pair.
// --newp '{"key":value}'  tuning values for the new side (the AIX.p settings in index.html), to try different tolerances.
// --new / --old  which AI improvements (the AIX switches in index.html) each side has: 'all' (as in play), 'none',
//                or a comma list. With the same setting on both sides it just plays matches (e.g. to read the stats).
// The new AI takes the home side in even-numbered matches and the away side in odd ones, so kick-off order evens out.
// Needs Playwright (with Chromium). Serves index.html itself, so no web server is needed.
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const NEWP = JSON.parse(arg('newp', '{}')), N = +arg('n', 4), PAR = +arg('par', 4), NEW = arg('new', 'all'), OLD = arg('old', 'all'), OUT = arg('out', null), LIMIT = +arg('limit', 240) * 1000;
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
  await p.addInitScript(() => { window.AI_TRACE = []; window.HO_COUNT = [0, 0]; window.NEG_COUNT = [0, 0]; window.LATE = [null, null]; window.SKX = { surf: [0, 0], vomit: [0, 0], gaze: [0, 0] };
    const t = setInterval(() => { if (typeof log !== 'function' || window.__hoHook) return; window.__hoHook = 1; clearInterval(t); const L = log;
      window.log = function (m) { try { if (/Handing off to/.test(String(m))) window.HO_COUNT[state.activeTeam]++; if (/becomes DISTRACTED|LASHES OUT|bellows and stamps/.test(String(m))) window.NEG_COUNT[state.activeTeam]++;
        if (/is CROWD SURFED/.test(String(m))) window.SKX.surf[state.activeTeam]++; if (/uses PROJECTILE VOMIT/.test(String(m))) window.SKX.vomit[state.activeTeam]++; if (/with a HYPNOTIC GAZE/.test(String(m))) window.SKX.gaze[state.activeTeam]++;
        const t = state.activeTeam; if (/--- .* Turn \d+ ---/.test(String(m)) && state.half >= 2 && window.LATE[t] == null && (TURNS - state.turn[t]) <= 2) window.LATE[t] = state.score[t] - state.score[1 - t]; } catch (e) {} return L.apply(this, arguments); }; }, 50);
    try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {} });
  await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));   // styling only; keeps the run offline
  await p.goto(`http://localhost:${port}/index.html?simtest`);
  const t0 = Date.now();
  await p.evaluate(([a, b, f0, f1, p0, p1]) => { window.AIP = [p0, p1]; AIX.flags[0] = f0; AIX.flags[1] = f1; AI.set(0, true); AI.set(1, true); window.launchMatch(a, b, { replaceOk: true }); }, [job.a, job.b, flags(f0), flags(f1), newHome ? NEWP : {}, newHome ? {} : NEWP]);
  let res = null, clicked = false;
  while (Date.now() - t0 < LIMIT) {
    await p.waitForTimeout(250);
    if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; });
    res = await p.evaluate(() => ({ over: !!state.isGameOver, half: state.half, turn: [state.turn[0], state.turn[1]], score: [state.score[0], state.score[1]],
      cas: [0, 1].map(t => state.players.filter(q => q.team !== t && q.isCasualty).length), to: MATCH.data ? MATCH.data.turnovers.slice() : [0, 0], bl: MATCH.data ? MATCH.data.blocks.slice() : [0, 0], rr: MATCH.data ? MATCH.data.rerolls.slice() : [0, 0], cp: [0, 1].map(t => state.players.filter(q => q.team === t).reduce((a, q) => a + ((q.gStats || {}).cp || 0), 0)), ho: window.HO_COUNT || [0, 0], neg: window.NEG_COUNT || [0, 0], late: window.LATE || [null, null], skx: window.SKX || null }));
    if (res.over) break;
  }
  const rec = await p.evaluate(() => window.BB_STALLS || []).catch(() => []);
  let stuck = null;
  if (!res || !res.over) stuck = await p.evaluate(() => ({ mode: state.mode, active: state.activeTeam, pending: CLOCK.pending(), sel: state.selectedId,
    log: [...document.querySelectorAll('#message-log > *')].slice(-8).map(e => e.textContent.trim()), trace: (window.AI_TRACE || []).slice(-6) })).catch(e => String(e));
  await ctx.close();
  const n = newHome ? 0 : 1;
  return { ...job, newSide: newHome ? 'home' : 'away', secs: +((Date.now() - t0) / 1000).toFixed(1), ...res,
    newTD: res.score[n], oldTD: res.score[1 - n], newCas: res.cas[n], oldCas: res.cas[1 - n], newTO: res.to[n], oldTO: res.to[1 - n], newBl: res.bl[n], oldBl: res.bl[1 - n], newRR: res.rr[n], oldRR: res.rr[1 - n], newCP: res.cp[n], oldCP: res.cp[1 - n], newHO: res.ho[n], oldHO: res.ho[1 - n], newNeg: res.neg[n], oldNeg: res.neg[1 - n], newLate: res.late[n], oldLate: res.late[1 - n], newSurf: res.skx ? res.skx.surf[n] : 0, oldSurf: res.skx ? res.skx.surf[1 - n] : 0, newVomit: res.skx ? res.skx.vomit[n] : 0, oldVomit: res.skx ? res.skx.vomit[1 - n] : 0, newGaze: res.skx ? res.skx.gaze[n] : 0, oldGaze: res.skx ? res.skx.gaze[1 - n] : 0, recovered: rec, stuck, errs: errs.slice(0, 3) };
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
  const recs = results.reduce((a, r) => a + (r.recovered ? r.recovered.length : 0), 0);
  if (recs) console.log(`stuck games recovered by the safety net: ${recs} (details in --out)`);
  console.log(`casualties  new caused ${sum('newCas')} - ${sum('oldCas')} old`);
  console.log(`turnovers   new ${sum('newTO')} - ${sum('oldTO')} old`);
  console.log(`re-rolls    new ${sum('newRR')} - ${sum('oldRR')} old (per team per match: ${(sum('newRR') / Math.max(1, done.length)).toFixed(1)} - ${(sum('oldRR') / Math.max(1, done.length)).toFixed(1)})`);
  console.log(`passes      new ${sum('newCP')} - ${sum('oldCP')} old completed; hand-offs new ${sum('newHO')} - ${sum('oldHO')} old`);
  console.log(`failed Bone Head / Really Stupid / Savagery / Fury rolls: new ${sum('newNeg')} - ${sum('oldNeg')} old`);
  const behind = k => done.filter(r => r[k + 'Late'] != null && r[k + 'Late'] < 0), back = (k, o) => behind(k).filter(r => r[k + 'TD'] >= r[o + 'TD']).length;
  console.log(`behind with 3 turns left: new was ${behind('new').length} times and drew level or won ${back('new', 'old')}; old was ${behind('old').length} times and came back ${back('old', 'new')}`);
  console.log(`crowd surfs new ${sum('newSurf')} - ${sum('oldSurf')} old; projectile vomits ${sum('newVomit')} - ${sum('oldVomit')}; hypnotic gazes ${sum('newGaze')} - ${sum('oldGaze')}`);
  console.log(`blocks      new ${sum('newBl')} - ${sum('oldBl')} old (per team per match: ${(sum('newBl') / Math.max(1, done.length)).toFixed(1)} - ${(sum('oldBl') / Math.max(1, done.length)).toFixed(1)})`);
});
