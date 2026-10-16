// node ai-training/block-chances.js RACES N [AIPjson] - needs AI.debugX.blockEval (in late-blocks.patch). At each computer turn start: players standing next to an opponent and their best block; at turn end: what they did
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, AIP = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(','); let blocks = 0, turns = 0;
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(a => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} if (a) window.AIP = JSON.parse(a); }, AIP);
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        window.BO = { rows: [], blocks: 0, turns: 0 }; let to = false, cur = null; const blk = new Set();
        const on = q => q && !q.isReserve && !q.isCasualty && !q.isKO && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const T = window.triggerTurnover; window.triggerTurnover = function () { to = true; return T.apply(this, arguments); };
        const R = window.resolveBlock; window.resolveBlock = function () { if (!state.charge) { BO.blocks++; try { if (state.combat && state.combat.atk) blk.add(state.combat.atk.id); } catch (e) {} } return R.apply(this, arguments); };
        const S = window.startTurnPhase; window.startTurnPhase = function () { const r = S.apply(this, arguments); try {
          to = false; blk.clear(); const t = state.activeTeam; cur = [];
          if (!state.charge) { BO.turns++; state.players.filter(q => q.team === t && on(q) && !q.isDown && !q.isStunned).forEach(q => {
            const ts = state.players.filter(d => d.team !== t && on(d) && !d.isDown && Math.max(Math.abs(d.x - q.x), Math.abs(d.y - q.y)) === 1);
            if (!ts.length) return; let best = null;
            ts.forEach(d => { const e = AI.debugX.blockEval(q, d); if (!best || e.ev - e.pTurn * 10 > best.ev - best.pTurn * 10) best = Object.assign({ car: state.ball.carrierId === d.id }, e); });
            cur.push({ id: q.id, x: q.x, y: q.y, type: q.type, best, carrier: state.ball.carrierId === q.id }); }); }
        } catch (e) { cur = null; } return r; };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try {
          if (cur && !state.charge) cur.forEach(c => { const q = getPlayerById(c.id); BO.rows.push({ race, to, n: c.best.n * (c.best.chooser === q.team ? 1 : -1), ev: +c.best.ev.toFixed(2), pTurn: +c.best.pTurn.toFixed(3), car: c.best.car, carrier: c.carrier, did: blk.has(q.id) ? 'block' : q.hasActed ? (q.actionTaken || (q.x !== c.x || q.y !== c.y ? 'moved' : 'acted')) : 'none', type: c.type, ballOurs: !!(state.ball.carrierId && getPlayerById(state.ball.carrierId) && getPlayerById(state.ball.carrierId).team === q.team), turn: state.turn[q.team], down: q.isDown }); });
        } catch (e) {} cur = null; return E.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => !!state.isGameOver)) break; }
      const r = await p.evaluate(() => BO); out.push(...r.rows); blocks += r.blocks; turns += r.turns; await p.close();
    }
  }));
  await b.close();
  const m = races.length * N;
  console.log(`matches ${m}, blocks a team a match ${(blocks / m / 2).toFixed(1)}, team turns ${turns}`);
  const grp = {}; out.forEach(r => { const key = (r.n > 0 ? '+' : '') + r.n + 'd'; (grp[key] = grp[key] || []).push(r); });
  for (const [k, rs] of Object.entries(grp).sort()) {
    const did = {}; rs.forEach(r => did[r.did] = (did[r.did] || 0) + 1);
    console.log(`${k}: ${rs.length} (${(rs.length / m / 2).toFixed(1)}/team/match), ev ${(rs.reduce((a, r) => a + r.ev, 0) / rs.length).toFixed(2)}, pTurn ${(rs.reduce((a, r) => a + r.pTurn, 0) / rs.length).toFixed(3)} | ` + Object.entries(did).sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a} ${b}`).join(', '));
  }
  // 2-dice own-choice not taken, not in turnover turns
  const miss = out.filter(r => r.n >= 2 && r.did !== 'block' && r.did !== 'blitz' && !r.to);
  console.log(`2+ dice blocks available, not taken, turn ended without a turnover: ${miss.length} (${(miss.length / m / 2).toFixed(1)}/team/match); did: ` + Object.entries(miss.reduce((a, r) => (a[r.did] = (a[r.did] || 0) + 1, a), {})).map(([a, b]) => `${a} ${b}`).join(', '));
  const hist = {}; miss.forEach(r => { const k = r.ev < 1 ? '<1' : r.ev < 2 ? '1-2' : r.ev < 2.5 ? '2-2.5' : r.ev < 3 ? '2.5-3' : '3+'; hist[k] = (hist[k] || 0) + 1; }); const tyc = {}; miss.filter(r => r.did === 'none' || r.did === 'acted').forEach(r => tyc[r.type] = (tyc[r.type] || 0) + 1); console.log('  idle/acted types:', JSON.stringify(tyc), ' ball ours:', miss.filter(r => r.ballOurs).length, ' turn 8:', miss.filter(r => r.turn === 8).length);
  console.log('  their ev:', JSON.stringify(hist), ' pTurn>0.12:', miss.filter(r => r.pTurn > 0.12).length, ' carriers:', miss.filter(r => r.carrier).length);
})();
