// node ai-training/bb-cages.js RACES N OUT.json [FLAGS]
// The BludBowl computer's cages, in the form fumbbl-cages.py --bb reads (mirror matches, ?simtest test mode). Needs a web server on :8765.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-cages.json', FLAGS = 'all'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(([race, flags]) => {
        if (flags !== 'all') AIX.flags = [flags.split(','), flags.split(',')];
        window.CG = []; let pend = null; const held = [0, 0];
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const up = q => onP(q) && !q.isDown && !q.isStunned;
        const carrier = () => { const c = state.ball.carrierId && getPlayerById(state.ball.carrierId); return c && up(c) ? c : null; };
        const SK = window.startKickoffSequence; window.startKickoffSequence = function () { pend = null; held[0] = held[1] = 0; return SK.apply(this, arguments); };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try {
          const t = state.activeTeam, c = carrier();
          if (pend && pend.team !== t) { pend.kept = !!(c && c.team === pend.team); CG.push(pend); pend = null; }
          if (c && c.team === t && !state.charge) {
            held[t]++; held[1 - t] = 0;
            const d = q => Math.max(Math.abs(q.x - c.x), Math.abs(q.y - c.y));
            const mates = state.players.filter(q => q.team === t && q.id !== c.id && up(q)), opps = state.players.filter(q => q.team !== t && up(q));
            const adj = mates.filter(q => d(q) === 1), corners = adj.filter(q => Math.abs(q.x - c.x) === 1 && Math.abs(q.y - c.y) === 1).length;
            const toGo = Math.abs(c.x - (t === 0 ? CFG.cols - 1 : 0));
            const rec = { race, team: t, adj: adj.length, corners, orth: adj.length - corners, within2: mates.filter(q => d(q) <= 2).length, within3: mates.filter(q => d(q) <= 3).length,
              oppAdj: opps.filter(q => d(q) === 1).length, opp3: opps.filter(q => d(q) <= 3).length, toGo, edge: Math.min(c.y, CFG.rows - 1 - c.y), nearest: Math.min(99, ...opps.map(d)), reach: state.players.filter(q => q.team !== t && onP(q) && !q.isStunned && d(q) - 1 <= (q.ma || 6) + 2 - (q.isDown ? 3 : 0)).length, turn: state.turn[t], held: held[t] };
            if (toGo > 0 && state.turn[t] < TURNS) pend = rec;
          } else if (!c || c.team !== t) held[t] = 0;
        } catch (e) {} return E.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, FLAGS]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => CG)); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.length} turns written to ${OUT}`);
})();
