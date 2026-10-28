// node ai-training/carrier-support.js RACES N [AIPjson] [flags]
// How well the computer protects its ball carrier. At the end of each computer turn that ends with its own carrier on
// the pitch (not having scored): how far the ball moved up the pitch this turn, how many team-mates stand next to the
// carrier, how many opponents could get at it next turn, and whether the other side has the ball off it by the end of
// their next turn. Mirror matches (each race against itself) in the ?simtest test mode. Needs a web server on :8765.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, AIP = '', FLAGS = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(','); let tds = 0;
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(([a, f]) => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} if (a) window.AIP = JSON.parse(a); window.__flags = f; }, [AIP, FLAGS]);
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        if (window.__flags) AIX.flags = [window.__flags.split(','), window.__flags.split(',')];
        window.CS = { rows: [] }; let pend = null, start = null;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && q.x >= 0 && q.x < CFG.cols;
        const toGo = (x, t) => Math.abs(x - (t === 0 ? CFG.cols - 1 : 0));
        const carrier = () => { const c = state.ball.carrierId && getPlayerById(state.ball.carrierId); return c && onP(c) ? c : null; };
        const S = window.startTurnPhase; window.startTurnPhase = function () { const r = S.apply(this, arguments); try {
          const t = state.activeTeam, bx = state.ball.x;
          start = { t, bx: bx != null ? bx : null };
        } catch (e) {} return r; };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try {
          const t = state.activeTeam, c = carrier();
          // the turn after one we recorded: does the side still have the ball?
          if (pend && pend.team !== t) { pend.kept = !!(c && c.team === pend.team); pend.scoredBy = (state.score[t] || 0) > pend.oppScore; CS.rows.push(pend); pend = null; }
          if (!state.charge && c && c.team === t && start && start.t === t) {
            const adj = state.players.filter(q => q.team === t && q.id !== c.id && onP(q) && !q.isDown && !q.isStunned && Math.max(Math.abs(q.x - c.x), Math.abs(q.y - c.y)) === 1).length;
            const tz = getTackleZones(c.x, c.y, 1 - t);
            // opponents able to reach the carrier next turn (a square next to it within their move + 2 Rushes, as the crow flies)
            const reach = state.players.filter(q => q.team !== t && onP(q) && !q.isStunned && Math.max(Math.abs(q.x - c.x), Math.abs(q.y - c.y)) - 1 <= (q.ma || 6) + 2 - (q.isDown ? 3 : 0)).length;
            const adv = start.bx != null ? toGo(start.bx, t) - toGo(c.x, t) : null;
            pend = { race, team: t, adv, adj, tz, reach, go: toGo(c.x, t), oppScore: state.score[1 - t] || 0 };
          }
        } catch (e) {} return E.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      const r = await p.evaluate(() => ({ rows: CS.rows, tds: (state.score[0] || 0) + (state.score[1] || 0) })); out.push(...r.rows); tds += r.tds; await p.close();
    }
  }));
  await b.close();
  const m = races.length * N, pct = (a, n) => n ? Math.round(100 * a / n) + '%' : '-';
  const lost = rs => rs.filter(r => !r.kept).length;
  console.log(`matches ${m}, touchdowns ${tds}; turns ending with our carrier on the pitch: ${out.length}, ball lost next turn ${lost(out)} (${pct(lost(out), out.length)})`);
  console.log('by team-mates next to the carrier:');
  [[0, 0], [1, 1], [2, 2], [3, 9]].forEach(([a, z]) => { const rs = out.filter(r => r.adj >= a && r.adj <= z); console.log(`  ${a}${z > a ? '+' : ''}: ${rs.length} turns, lost ${pct(lost(rs), rs.length)}, mean moved ${(rs.reduce((s, r) => s + (r.adv || 0), 0) / Math.max(1, rs.length)).toFixed(1)}, opponents in reach ${(rs.reduce((s, r) => s + r.reach, 0) / Math.max(1, rs.length)).toFixed(1)}`); });
  const run = out.filter(r => r.adv >= 4), runAlone = run.filter(r => r.adj <= 1);
  console.log(`after a run of 4+ squares: ${run.length} turns, alone or 1 next to it ${runAlone.length} (${pct(runAlone.length, run.length)}), lost next turn ${pct(lost(run), run.length)} (alone/1: ${pct(lost(runAlone), runAlone.length)}, 2+: ${pct(lost(run.filter(r => r.adj >= 2)), run.length - runAlone.length)})`);
  console.log('by race (turns, mean next to it, lost):');
  races.forEach(rc => { const rs = out.filter(r => r.race === rc); console.log(`  ${rc}: ${rs.length}, ${(rs.reduce((s, r) => s + r.adj, 0) / Math.max(1, rs.length)).toFixed(2)}, ${pct(lost(rs), rs.length)}`); });
})();
