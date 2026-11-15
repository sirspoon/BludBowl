// bb-rerolls.js without a browser: the BludBowl computer's team re-rolls in mirror matches (?simtest test mode), the game in
// jsdom (tools/headless-match.js), one Node process per match, several at once. Writes the form fumbbl-rerolls.py --bb reads.
//   node ai-training/bb-rerolls-jsdom.js RACES N OUT.json [FLAGS] [AIPjson] [--par 14]
const path = require('path'), fs = require('fs'), os = require('os'), { spawn } = require('child_process');
const KIND = { DODGE: 'dodge', RUSH: 'rush', PICKUP: 'pick-up', CATCH: 'catch', PASS: 'pass', LANDING: 'landing', 'STAND UP': 'stand up', 'JUMP UP': 'stand up', INTERCEPT: 'interception', 'THROW TEAMMATE': 'throw team-mate', 'THROW BOMB': 'pass', JUMP: 'jump', LEAP: 'jump' };
const LIMIT = 300000;

// the hooks bb-rerolls.js puts in the page (unchanged), as a function run inside it
function hooks(race, flags, aip, KIND) {
  if (flags !== 'all') AIX.flags = [flags.split(','), flags.split(',')];
  window.AIP = [aip, aip]; window.RR = { ev: [], unused: [] }; let ctx = null, blk = null;
  const cat = c => { const B = (c.atk.skills || []).includes('Block'), DB = (c.def.skills || []).includes('Block'), DD = (c.def.skills || []).includes('Dodge'), TK = (c.atk.skills || []).includes('Tackle');
    const f = x => x === 1 ? 0 : x === 2 ? (B ? (DB ? 1 : 2) : 0) : x === 3 || x === 4 ? 1 : x === 5 ? (!DD || TK ? 2 : 1) : 2;
    const v = (c.dice || []).map(f); const r = v.length ? (c.chooser === c.atk.team ? Math.max(...v) : Math.min(...v)) : 1; return ['down', 'nothing', 'kd'][r]; };
  const acted = t => state.players.filter(q => q.team === t && q.hasActed).length;
  const base = (pl, kind) => ({ kind, side: pl.team, race, turn: state.turn[pl.team], rr: state.rr[pl.team] || 0, act: acted(pl.team), avail: (state.rr[pl.team] || 0) > 0 && !state.teamRRUsedThisTurn,
    carrier: state.ball.carrierId === pl.id || ['pick-up', 'catch', 'pass'].includes(kind) });
  const L = window.log; window.log = function (m) { try { const s = String(m);
    if (ctx && /TEAM RE-ROLL used!/.test(s)) ctx.trr = true;
    if (ctx && / to re-roll!/.test(s)) ctx.skill = (s.match(/uses (.+?) to re-roll/) || [])[1] || 'skill';
    if (/TEAM RE-ROLL used for Block dice/.test(s) && state.combat && !state.combat._cat0) { state.combat._cat0 = cat(state.combat); state.combat._nd0 = (state.combat.dice || []).length; state.combat._trr = true; }
  } catch (e) {} return L.apply(this, arguments); };
  const SR = window.setupRoll; window.setupRoll = function (type, pl, tg, sk, onPass, onFail, ex) {
    if (!pl || pl.team !== state.activeTeam || !AI.isAI(pl.team) || !KIND[type]) return SR.apply(this, arguments);
    const c = Object.assign(base(pl, KIND[type]), { trr: false, skill: null }); ctx = c;
    const fin = ok => { if (ctx === c) ctx = null; if (c.done) return; c.done = true; const failedFirst = c.trr || c.skill || !ok; if (!failedFirst) return; RR.ev.push(Object.assign({}, c, { rerolled: c.skill ? c.skill : c.trr ? 'Team ReRoll' : null })); };
    return SR.call(this, type, pl, tg, sk, function () { fin(true); return onPass.apply(this, arguments); }, function () { fin(false); return onFail.apply(this, arguments); }, ex);
  };
  const TR = window.teamRerollable; window.teamRerollable = function (pl, label, pass, done, first) {
    let firstOk = null; const c = pl && AI.isAI(pl.team) && pl.team === state.activeTeam ? base(pl, 'Bone Head etc.') : null, rr0 = pl ? (state.rr[pl.team] || 0) : 0;
    // (a team re-roll spent on it shows as one fewer left; the computer decides these since v5.02, rr3)
    return TR.call(this, pl, label, r => { const ok = pass(r); if (firstOk === null) firstOk = ok; return ok; }, r => { if (c && firstOk === false) RR.ev.push(Object.assign(c, { rerolled: (state.rr[pl.team] || 0) < rr0 ? 'Team ReRoll' : null })); return done(r); }, first);
  };
  const RB = window.resolveBlock; window.resolveBlock = function () { try { const c = state.combat; if (c && !c._rr && AI.isAI(c.atk.team)) { c._rr = 1; if (blk) RR.ev.push(blk); blk = Object.assign(base(c.atk, 'block'), { trr: !!(c.aiRerolled || c._trr), cat: c._cat0 || cat(c), nd: c._nd0 || (c.dice || []).length }); if (c._trr) blk.avail = true; } } catch (e) {} return RB.apply(this, arguments); };
  const E = window.endTeamTurn; window.endTeamTurn = function () { try { if (blk) { RR.ev.push(blk); blk = null; } const t = state.activeTeam; if (state.turn[t] >= TURNS) RR.unused.push(state.rr[t] || 0); } catch (e) {} return E.apply(this, arguments); };
  setInterval(() => { if (state.isGameOver && !window.__fin) { window.__fin = 1; window.__done(); }
    const b = document.getElementById('btn-lineup-confirm'); if (b && !b.closest('.hidden')) b.click(); }, 200);
  try { localStorage.setItem('bb-replays', '0'); } catch (e) {}
  AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
}

if (process.argv[2] === '--child') {
  const { openGame } = require(path.join(__dirname, '..', 'tools', 'headless-match.js'));
  const job = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  (async () => {
    const { window: w } = await openGame({ simtest: true });
    const done = new Promise(res => { w.__done = res; setTimeout(res, LIMIT); });
    w.__args = JSON.stringify([job.race, job.flags, job.aip, KIND]);
    w.eval(`(${hooks.toString()}).apply(null, JSON.parse(window.__args))`);
    await done;
    const r = JSON.parse(w.eval('JSON.stringify(Object.assign(window.RR, { over: !!state.isGameOver }))'));
    try { w.close(); } catch (e) {}
    fs.writeFileSync(process.argv[4], JSON.stringify(r));   // (a file: a pipe can be cut off by exit)
    process.exit(0);
  })();
} else {
  const args = process.argv.slice(2).filter((a, i, A) => a !== '--par' && A[i - 1] !== '--par');
  const pi = process.argv.indexOf('--par'), PAR = pi > 0 ? +process.argv[pi + 1] : 4;
  const [RACES, N = 2, OUT = 'bb-rerolls.json', FLAGS = 'all', AIPJ = '{}'] = args;
  const jobs = []; RACES.split(',').forEach(race => { for (let i = 0; i < +N; i++) jobs.push({ race, flags: FLAGS, aip: JSON.parse(AIPJ) }); });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bbrr-')), out = { events: [], unusedL: [], matches: 0 };
  let running = 0, k = 0, fin = 0;
  const next = () => {
    if (!jobs.length) { if (!running) finish(); return; }
    const job = jobs.shift(), jf = path.join(tmp, `j${k}.json`), of = path.join(tmp, `o${k++}.json`);
    fs.writeFileSync(jf, JSON.stringify(job)); running++;
    const p = spawn(process.execPath, [__filename, '--child', jf, of], { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', () => {
      running--; fin++;
      try { const r = JSON.parse(fs.readFileSync(of, 'utf8')); if (r.over) { out.events.push(...r.ev); out.unusedL.push(...r.unused); out.matches++; } } catch (e) {}
      if (fin % 12 === 0) console.log(`${fin} matches`);
      next();
    });
  };
  const finish = () => {
    out.unused = out.unusedL.reduce((a, c) => a + c, 0) / Math.max(1, out.unusedL.length); delete out.unusedL;
    fs.writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.events.length} events from ${out.matches} matches written to ${OUT}`);
    process.exit(0);
  };
  for (let i = 0; i < Math.min(PAR, jobs.length); i++) next();
}
