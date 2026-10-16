// node ai-training/pickups.js RACES N [flags] - every computer pick-up roll: target, markers on the ball, could Secure the Ball have been used, a team-mate with an easier roll, markers blockable first, re-roll, result
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, FLAGS = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(f => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} window.__flags = f; }, FLAGS);
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        if (window.__flags) AIX.flags = [window.__flags.split(','), window.__flags.split(',')];
        window.PU = [];
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        let rrUsed = false; const oSR = window.spendTeamReroll; window.spendTeamReroll = function () { rrUsed = true; return oSR.apply(this, arguments); };
        document.addEventListener('click', e => {
          if (!e.target || e.target.id !== 'btn-roll-confirm') return;
          const r = state.pendingRoll; if (!r || r._pu || r.type !== 'PICKUP') return; r._pu = 1;
          const pl = r.player, t = pl.team, bx = state.ball.x, by = state.ball.y;
          const opp = state.players.filter(q => q.team !== t && onP(q) && !q.isDown && !q.isStunned && !q.isDistracted);
          const markers = opp.filter(o => Math.max(Math.abs(o.x - bx), Math.abs(o.y - by)) === 1);
          const mates = state.players.filter(q => q.team === t && q.id !== pl.id && onP(q) && !q.hasActed && !q.isStunned);
          // markers one of ours could block right now (standing next to them)
          const blockable = markers.filter(m => mates.some(q => !q.isDown && Math.max(Math.abs(q.x - m.x), Math.abs(q.y - m.y)) === 1)).length;
          // a team-mate who could reach the ball square and pick up on an easier roll (path odds ignored)
          let better = 0; const sv = [pl.x, pl.y]; pl.x = -50; pl.y = -50; state.ball.x = bx; state.ball.y = by;
          try { mates.forEach(q => { if (q.isDown || q.skills.includes('No Hands')) return; const ms = getValidMoves(q).find(m => m.x === bx && m.y === by); if (ms && ms.prob >= 50 && Math.min(6, getPickupTarget(q, bx, by) + weatherTargetMod('PICKUP')) < r.target) better++; }); } catch (e) {}
          pl.x = sv[0]; pl.y = sv[1];
          const near2 = opp.filter(o => Math.max(Math.abs(o.x - bx), Math.abs(o.y - by)) <= 3).length;
          const quiet = !state.secureUsed && !isBigGuy(pl) && !pl.skills.includes('Unsteady') && !opp.some(o => Math.max(Math.abs(o.x - bx), Math.abs(o.y - by)) <= 2);
          const rec = { race, quiet, rest: Math.max(0, (pl.remainingMA || 0)), tz: getTackleZones(bx, by, t === 0 ? 1 : 0), raw: r.raw, sec: pl.actionTaken, pos: [bx, by], wx: weatherTargetMod('PICKUP'), weather: state.weather && state.weather.key, target: r.target, ag: pl.ag, sh: pl.skills.includes('Sure Hands'), markers: markers.length, blockable, better, still: mates.length, rr: state.rr[t] || 0, turn: state.turn[t], near3: near2, half: (t === 0 ? bx <= 12 : bx >= 13) ? 'own' : 'theirs' };
          rrUsed = false;
          const op = r.onPass, of = r.onFail;
          r.onPass = function () { if (rec.ok == null) { rec.ok = true; rec.rr = rrUsed ? 'used' : rec.rr; } return op.apply(this, arguments); };
          r.onFail = function () { if (rec.ok == null) { rec.ok = false; rec.rrUsed = rrUsed; } return of.apply(this, arguments); };
          PU.push(rec);
        }, true);
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => !!state.isGameOver)) break; }
      out.push(...await p.evaluate(() => PU)); await p.close();
    }
  }));
  await b.close();
  const m = races.length * N, c = (rs, f) => rs.filter(f).length;
  console.log(`matches ${m}: pick-ups ${out.length} (${(out.length / m / 2).toFixed(1)} a team a match), failed ${c(out, r => r.ok === false)}`);
  [2, 3, 4, 5, 6].forEach(t => { const rs = out.filter(r => r.target === t); if (!rs.length) return;
    const f = rs.filter(r => r.ok === false);
    console.log(`  ${t}+: ${rs.length} tries, ${f.length} failed (${Math.round(100 * f.length / rs.length)}%) | markers on ball ${(rs.reduce((a, r) => a + r.markers, 0) / rs.length).toFixed(1)}, a marker blockable first ${c(rs, r => r.blockable > 0)}, easier team-mate ${c(rs, r => r.better > 0)}, Sure Hands ${c(rs, r => r.sh)}, re-roll used on a fail ${c(f, r => r.rrUsed)}, no re-roll left ${c(rs, r => r.rr === 0)}, 3+ still to act ${c(rs, r => r.still >= 3)}`); });
  const hard = out.filter(r => r.target >= 4);
  console.log(`  4+ or harder: ${hard.length}; in our half ${c(hard, r => r.half === 'own')}; turn 1-2 ${c(hard, r => r.turn <= 2)}; AG of pickers ${JSON.stringify(hard.reduce((a, r) => (a[r.ag] = (a[r.ag] || 0) + 1, a), {}))}`);
  require('fs').writeFileSync('pickups.json', JSON.stringify(out));
})();
