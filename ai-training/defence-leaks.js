// node ai-training/defence-leaks.js RACES N [AIPjson] [flags] - needs AI.debugX.scoreChance (in defence-screen.patch). At the end of each computer defensive turn: their carrier's chance to run it in next turn (dodges and Rushes counted), and whether they scored
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
        window.LK = { rows: [], tds: 0 }; let pend = null, start = null, to = false, acts = [];
        const T = window.triggerTurnover; window.triggerTurnover = function () { to = true; return T.apply(this, arguments); };
        const L = window.log; window.log = function (m) { try { if (typeof m === 'string' && /^(  )?[A-Z]/.test(m) && acts.length < 40) acts.push(m.slice(0, 90)); } catch (e) {} return L.apply(this, arguments); };
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && q.x >= 0 && q.x < CFG.cols;
        const S = window.startTurnPhase; window.startTurnPhase = function () { const r = S.apply(this, arguments); try { const t = state.activeTeam, c = state.ball.carrierId && getPlayerById(state.ball.carrierId);
          to = false; acts = []; start = c && c.team !== t && onP(c) ? { cid: c.id, ch: AI.debugX.scoreChance(c), free: state.players.filter(q => q.team === t && onP(q) && !q.isStunned).length } : null; } catch (e) { start = null; } return r; };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try {
          const t = state.activeTeam, sc = [state.score[0] || 0, state.score[1] || 0];
          if (pend && pend.team !== t) { pend.scored = sc[pend.att] > pend.s; LK.rows.push(pend); pend = null; }
          const c = state.ball.carrierId && getPlayerById(state.ball.carrierId);
          if (!state.charge && c && c.team !== t && !c.isReserve && !c.isKO && !c.isCasualty && c.x >= 0 && c.x < CFG.cols) pend = { race, team: t, att: c.team, s: sc[c.team], ch: +AI.debugX.scoreChance(c).toFixed(3), go: c.team === 0 ? CFG.cols - 1 - c.x : c.x, turn: state.turn[t], to, acts: acts.slice(), ch0: start && start.cid === c.id ? +start.ch.toFixed(3) : null, idle: state.players.filter(q => q.team === t && onP(q) && !q.hasActed && !q.isStunned && !q.isDown).length, fp: JSON.stringify(state.players.filter(onP).map(q => [q.team, q.x, q.y, q.isDown ? 1 : 0, q.id === c.id ? 1 : 0])) };
        } catch (e) {} return E.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => !!state.isGameOver)) break; }
      const r = await p.evaluate(() => ({ rows: LK.rows, tds: (state.score[0] || 0) + (state.score[1] || 0) })); out.push(...r.rows); tds += r.tds; await p.close();
    }
  }));
  await b.close();
  const m = races.length * N, sc = out.filter(r => r.scored);
  console.log(`matches ${m}, touchdowns ${tds}; defensive turns with their carrier on the pitch ${out.length}; scored next turn ${sc.length}`);
  const B = [[0, 0.001], [0.001, 0.1], [0.1, 0.3], [0.3, 0.6], [0.6, 1.01]];
  B.forEach(([a, z]) => { const rs = out.filter(r => r.ch >= a && r.ch < z); console.log(`  run-in chance ${a}-${z}: ${rs.length} turns, scored ${rs.filter(r => r.scored).length} (${rs.length ? Math.round(100 * rs.filter(r => r.scored).length / rs.length) : 0}%)`); });
  const hi = out.filter(r => r.ch >= 0.6);
  console.log('  high-chance turns: chance at start of our turn ->', hi.map(r => `${r.ch0 == null ? 'new' : r.ch0.toFixed(2)}>${r.ch.toFixed(2)} go${r.go} idle${r.idle}${r.to ? 'T' : ''}${r.scored ? '*' : ''}`).join('  '));
  require('fs').writeFileSync('leak-hi.json', JSON.stringify(hi));
  const near = out.filter(r => r.go <= 12); console.log(`  carrier within 12 squares: ${near.length} turns, mean run-in chance ${(near.reduce((a, r) => a + r.ch, 0) / Math.max(1, near.length)).toFixed(3)}, scored ${near.filter(r => r.scored).length}`);
})();
