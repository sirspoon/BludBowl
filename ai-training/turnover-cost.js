// node ai-training/turnover-cost.js RACES N [flags] - needs AI.debugX.blockEval (in turn-order.patch). At each computer turnover: the cause, and what the players still to act lost (safe blocks, 2-dice blocks, dice-free moves)
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, FLAGS = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(','); let turns = 0;
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(f => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} window.__flags = f; }, FLAGS);
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        if (window.__flags) AIX.flags = [window.__flags.split(','), window.__flags.split(',')];
        window.OR = { rows: [], turns: 0 }; let lines = [], acted = 0, done = false;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const L = window.log; window.log = function (m) { try { if (typeof m === 'string') { lines.push(m.replace(/<[^>]+>/g, '').slice(0, 80)); if (lines.length > 12) lines.shift(); } } catch (e) {} return L.apply(this, arguments); };
        const S = window.startTurnPhase; window.startTurnPhase = function () { lines = []; done = false; if (!state.charge) OR.turns++; return S.apply(this, arguments); };
        const T = window.triggerTurnover; window.triggerTurnover = function () { try { if (!done && !state.charge) { done = true;
          const t = state.activeTeam, mine = state.players.filter(q => q.team === t && onP(q) && !q.hasActed && !q.isStunned);
          const opp = state.players.filter(q => q.team !== t && onP(q) && !q.isDown && !q.isStunned && !q.isDistracted);
          const marked = q => opp.some(o => Math.max(Math.abs(o.x - q.x), Math.abs(o.y - q.y)) === 1);
          let safeBlk = 0, goodBlk = 0, free = 0, stand = 0;
          const actor = state.combat && state.combat.atk ? state.combat.atk.id : (state.pathData ? state.pathData.pid : null);
          mine.forEach(q => { if (q.id === actor) return;
            if (q.isDown) { stand++; return; }
            let best = null; opp.filter(o => Math.max(Math.abs(o.x - q.x), Math.abs(o.y - q.y)) === 1).forEach(o => { const e = AI.debugX.blockEval(q, o); if (e.chooser === t && (!best || e.pTurn < best.pTurn)) best = e; });
            if (best && best.pTurn < 0.05) safeBlk++; else if (best && best.pTurn <= 0.12) goodBlk++;
            else if (!marked(q)) free++; });
          const txt = lines.join(' | ');
          const L4 = lines.slice(-5).join(' | '), need = (L4.match(/Needed (\d)\+/g) || []).pop();
          const cause = /fumbles the ball/.test(L4) ? 'pickup' + (need ? need.replace(/\D/g, '') : '') : /drops the ball|fails to catch|incomplete|Inaccurate|intercept/i.test(L4) ? 'catch/pass' : /Foul|FOUL|sent off|Ejected/i.test(L4) ? 'foul'
            : (L4.match(/falls!/g) || []).length >= 2 ? 'block BD' : /Dodge|DODGE/.test(L4) ? 'dodge' : /BLITZ!/.test(L4) && /Needed 2\+/.test(L4) ? 'rush' : /Rush|GFI|Going For It|Needed 2\+/i.test(L4) ? 'rush' : /SKULL|Skull|Result/i.test(L4) ? 'block' : 'other';
          (window.OR.cause = window.OR.cause || {}); if (!state.charge) window.OR.need = need;
          const c = state.ball.carrierId && getPlayerById(state.ball.carrierId);
          OR.rows.push({ race, cause, left: mine.length - (mine.some(q => q.id === actor) ? 1 : 0), safeBlk, goodBlk, free, stand, turn: state.turn[t], ballOurs: !!(c && c.team === t), acts: state.players.filter(q => q.team === t && onP(q) && q.hasActed).length, last: lines.slice(-4).join(' | ') }); } } catch (e) { OR.err = String(e); } return T.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => !!state.isGameOver)) break; }
      const r = await p.evaluate(() => OR); out.push(...r.rows); turns += r.turns; if (r.err) console.log('err', r.err); await p.close();
    }
  }));
  await b.close();
  const m = races.length * N, n = out.length, sum = k => out.reduce((a, r) => a + r[k], 0);
  console.log(`matches ${m}, team turns ${turns}, turnovers ${n} (${(n / m / 2).toFixed(1)} a team a match)`);
  const by = {}; out.forEach(r => { (by[r.cause] = by[r.cause] || []).push(r); });
  for (const [k, rs] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
    const s = q => rs.reduce((a, r) => a + r[q], 0);
    console.log(`  ${k.padEnd(7)} ${String(rs.length).padStart(4)}: players still to act ${s('left')}, of them safe blocks ${s('safeBlk')}, 2-dice blocks ${s('goodBlk')}, free to move ${s('free')}, prone ${s('stand')}`);
  }
  console.log(`  all: still to act ${sum('left')} (${(sum('left') / n).toFixed(1)} a turnover); safe blocks lost ${sum('safeBlk')}, other 2-dice blocks ${sum('goodBlk')}, free movers ${sum('free')}, prone ${sum('stand')}`);
  console.log(`  turnovers with a safe block still waiting: ${out.filter(r => r.safeBlk).length}; with 3+ players still to act: ${out.filter(r => r.left >= 3).length}`);
  require('fs').writeFileSync('order-rows.json', JSON.stringify(out));
})();
