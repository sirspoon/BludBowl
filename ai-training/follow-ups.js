// node ai-training/follow-ups.js RACES N [AIPjson] [flags]
// When the computer's blocker may follow up: who follows and who stays, and whether that player then blocks again in the
// team's next turn. Mirror matches (each race against itself) in the ?simtest test mode. Needs a web server on :8765.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, AIP = '', FLAGS = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(','); let blocks = 0;
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(([a, f]) => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} if (a) window.AIP = JSON.parse(a); window.__flags = f; }, [AIP, FLAGS]);
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        if (window.__flags) AIX.flags = [window.__flags.split(','), window.__flags.split(',')];
        window.FU = { rows: [], blocks: 0 }; const blockedIn = new Map();   // "team:turn" -> attacker ids that blocked
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && q.x >= 0 && q.x < CFG.cols;
        const oRB = window.resolveBlock;
        window.resolveBlock = function () { const c = state.combat; if (c && !c._fu) { c._fu = 1; FU.blocks++; const k = c.atk.team + ':' + state.half + ':' + state.turn[c.atk.team]; if (!blockedIn.has(k)) blockedIn.set(k, new Set()); blockedIn.get(k).add(c.atk.id); } return oRB.apply(this, arguments); };
        const rec = followed => {
          const c = state.combat, a = c && c.atk, v = c && c.vacatedSquare; if (!a || !v) return;
          const opp = 1 - a.team, tz = (x, y) => getTackleZones(x, y, opp);
          FU.rows.push({ race, team: a.team, id: a.id, pos: a.type, st: a.st, av: a.av, block: (a.skills || []).includes('Block'), carrier: state.ball.carrierId === a.id,
            defDown: !!(c.def && c.def.isDown), here: tz(a.x, a.y), there: tz(v.x, v.y), forward: Math.abs(v.x - (a.team === 0 ? CFG.cols - 1 : 0)) < Math.abs(a.x - (a.team === 0 ? CFG.cols - 1 : 0)),
            attacking: !!(state.ball.carrierId && getPlayerById(state.ball.carrierId) && getPlayerById(state.ball.carrierId).team === a.team), followed,
            key: a.team + ':' + state.half + ':' + (state.turn[a.team] + 1) });
        };
        const oG = window.handleGridClick;
        window.handleGridClick = function (x, y) { try { if (state.mode === MODES.FOLLOWUP_CHOICE && state.combat && state.combat.vacatedSquare && state.combat.vacatedSquare.x === x && state.combat.vacatedSquare.y === y && AI.isOn(state.combat.atk.team)) rec(true); } catch (e) {} return oG.apply(this, arguments); };
        document.addEventListener('click', e => { try { if (e.target && e.target.id === 'btn-stay-put' && state.mode === MODES.FOLLOWUP_CHOICE && AI.isOn(state.combat.atk.team)) rec(false); } catch (er) {} }, true);
        window.__blockedIn = blockedIn;
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      const r = await p.evaluate(() => ({ rows: FU.rows.map(x => Object.assign(x, { again: !!(__blockedIn.get(x.key) || new Set()).has(x.id) })), blocks: FU.blocks }));
      out.push(...r.rows); blocks += r.blocks; await p.close();
    }
  }));
  await b.close();
  const pct = (a, n) => n ? Math.round(100 * a / n) + '%' : '-', m = races.length * N;
  console.log(`matches ${m}, blocks ${blocks} (${(blocks / m / 2).toFixed(1)} per team per match); follow-up choices ${out.length}, followed ${pct(out.filter(r => r.followed).length, out.length)}`);
  const show = (lab, rs) => { const f = rs.filter(r => r.followed), s = rs.filter(r => !r.followed); console.log(`  ${lab}: ${rs.length}, followed ${pct(f.length, rs.length)} · blocked again next turn: followed ${pct(f.filter(r => r.again).length, f.length)}, stayed ${pct(s.filter(r => r.again).length, s.length)}`); };
  show('strong (ST4+ or AV10+), not carrying', out.filter(r => !r.carrier && (r.st >= 4 || r.av >= 10)));
  show('others, not carrying', out.filter(r => !r.carrier && r.st < 4 && r.av < 10));
  show('carrying the ball', out.filter(r => r.carrier));
  show('strong, the square has more tackle zones', out.filter(r => !r.carrier && (r.st >= 4 || r.av >= 10) && r.there > r.here));
  show('strong, the defender knocked down', out.filter(r => !r.carrier && (r.st >= 4 || r.av >= 10) && r.defDown));
  console.log('by position (choices, followed):');
  const g = {}; out.filter(r => !r.carrier).forEach(r => { const k = `${r.race} ${r.pos}`; (g[k] = g[k] || []).push(r); });
  Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, 18).forEach(([k, v]) => console.log(`  ${k}: ${v.length}, ${pct(v.filter(r => r.followed).length, v.length)}`));
})();
