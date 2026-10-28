// node ai-training/drives.js RACES N NEWFLAGS OLDFLAGS [newAIPjson]
// Drive by drive, the new AI against the old (mirror matches, sides swapped each match, ?simtest test mode): for each
// kick-off, who receives (new or old) and how the drive ends (the receivers score, the kickers score, or neither before the
// half ends), plus the receivers' first turn: blocks thrown, opponents knocked down, own players knocked down, a turnover.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, NEWF = 'all', OLDF = 'all', NEWP = '{}'] = process.argv.slice(2);
const fl = f => f === 'all' ? null : f.split(',');
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length], newHome = k % 2 === 0;
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(([race, f0, f1, p0, p1, newT]) => {
        AIX.flags = [f0, f1]; window.AIP = [p0, p1];
        window.DR = []; let cur = null;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && q.x >= 0 && q.x < CFG.cols;
        const close = why => { if (!cur) return; const s = state.score; cur.recvScored = (s[cur.recv] || 0) - cur.s0[cur.recv]; cur.kickScored = (s[1 - cur.recv] || 0) - cur.s0[1 - cur.recv]; cur.end = why; DR.push(cur); cur = null; };
        const SK = window.startKickoffSequence; window.startKickoffSequence = function (kt, rt) { try { close('next kick-off'); cur = { race, recv: rt, recvNew: rt === newT, half: state.half, s0: [state.score[0] || 0, state.score[1] || 0], t1: null, recvDown: 0 }; } catch (e) {} return SK.apply(this, arguments); };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { try {
          if (cur && cur.t1 && cur.t1.open) { cur.t1.open = false; cur.t1.after = state.players.filter(q => q.team === cur.recv && onP(q) && !q.isDown).length; cur.t1.theirUp = state.players.filter(q => q.team !== cur.recv && onP(q) && !q.isDown).length; }
          if (cur && !cur.t1 && state.activeTeam === cur.recv && !state.isResolvingKickoff) cur.t1 = { open: true, blocks: 0, kd: 0, ownDown: 0, to: false };
          if (cur && cur.t1 && !cur.t1.open && cur.k2 == null && state.activeTeam !== cur.recv) cur.k2 = 1;
        } catch (e) {} return ST.apply(this, arguments); };
        const RB = window.resolveBlock; window.resolveBlock = function () { const c = state.combat; try { if (cur && cur.t1 && cur.t1.open && c && !c._dr && c.atk.team === cur.recv) { c._dr = 1; cur.t1.blocks++; } } catch (e) {} return RB.apply(this, arguments); };
        const TT = window.triggerTurnover; window.triggerTurnover = function () { try { if (cur && cur.t1 && cur.t1.open && state.activeTeam === cur.recv) { cur.t1.to = true; cur.t1.why = String(arguments[0] || '').replace(/[0-9]+/g, '').slice(0, 40); } } catch (e) {} return TT.apply(this, arguments); };
        const HE = window.triggerGameOver; window.triggerGameOver = function () { try { close('game over'); } catch (e) {} return HE.apply(this, arguments); };
        window.__close = close;
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, newHome ? fl(NEWF) : fl(OLDF), newHome ? fl(OLDF) : fl(NEWF), newHome ? JSON.parse(NEWP) : {}, newHome ? {} : JSON.parse(NEWP), newHome ? 0 : 1]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => { __close('end'); return DR; })); await p.close();
    }
  }));
  await b.close();
  const pct = (a, n) => n ? Math.round(100 * a / n) + '%' : '-';
  [true, false].forEach(nw => {
    const rs = out.filter(r => r.recvNew === nw), t1 = rs.filter(r => r.t1);
    const avg = f => (t1.reduce((s, r) => s + f(r), 0) / Math.max(1, t1.length)).toFixed(2);
    console.log(`${nw ? 'NEW' : 'OLD'} receiving: ${rs.length} drives; receivers scored ${pct(rs.filter(r => r.recvScored > 0).length, rs.length)}, kickers scored ${pct(rs.filter(r => r.kickScored > 0).length, rs.length)}`);
    const why = {}; t1.filter(r => r.t1.to).forEach(r => { why[r.t1.why] = (why[r.t1.why] || 0) + 1; });
    console.log('   first-turn turnovers: ' + Object.entries(why).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
    console.log(`   first turn: blocks ${avg(r => r.t1.blocks)}, turnover ${pct(t1.filter(r => r.t1.to).length, t1.length)}, ours standing after ${avg(r => r.t1.after || 0)}, theirs standing after ${avg(r => r.t1.theirUp || 0)}`);
  });
})();
