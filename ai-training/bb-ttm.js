// node ai-training/bb-ttm.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's Throw Team-mates, in the form fumbbl-ttm.py --bb reads (mirror matches, ?simtest test mode).
// FLAGS: '' for every AI switch on, or a comma-separated list.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-ttm.json', FLAGS = '', AIPJ = '{}'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = { throws: [], teamMatches: 0 }; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(([race, flags, aip]) => {
        if (flags) AIX.flags = [flags.split(','), flags.split(',')];
        window.AIP = [aip, aip]; window.TT = { throws: [], can: 0 }; let T = null;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const cheb = (a, c) => Math.max(Math.abs(a.x - c.x), Math.abs(a.y - c.y));
        const toGo = (x, t) => Math.abs(x - (t === 0 ? CFG.cols - 1 : 0));
        const close = () => { if (!T) return; const q = getPlayerById(T.thrownId);
          if (q && onP(q)) { T.landed = !q.isDown; T.gain = T.go0 - toGo(q.x, T.team); T.toGoEnd = toGo(q.x, T.team); T.ontoOpp = T.opp0.some(o => o[0] === q.x && o[1] === q.y); T.nextToCarrier = !!(T.theirC && cheb(q, { x: T.theirC[0], y: T.theirC[1] }) === 1); } else T.out = true;
          T.purpose = T.withBall ? 'ball' : (T.ontoOpp || T.hurt) ? 'onto an opponent' : T.nextToCarrier ? 'next to their carrier' : 'up the pitch';
          T.td = (state.score[T.team] || 0) > T.s0; delete T.opp0; delete T.theirC; TT.throws.push(T); T = null; };
        const X = window.executeTTMThrow; window.executeTTMThrow = function (thrower, thrown, tx, ty) { try { if (AI.isAI(thrower.team)) { close();
          const c = state.ball.carrierId && getPlayerById(state.ball.carrierId);
          T = { race, team: thrower.team, side: thrower.team, kick: !!state.ttmKick, turn: state.turn[thrower.team], thrower: thrower.type, thrownId: thrown.id, thrownType: thrown.type, withBall: state.ball.carrierId === thrown.id,
            go0: toGo(thrown.x, thrower.team), opp0: state.players.filter(o => o.team !== thrower.team && onP(o) && !o.isDown).map(o => [o.x, o.y]), theirC: c && c.team !== thrower.team && onP(c) ? [c.x, c.y] : null,
            aimedOnto: state.players.some(o => o.team !== thrower.team && onP(o) && o.x === tx && o.y === ty), hurt: false, s0: state.score[thrower.team] || 0 }; } } catch (e) {} return X.apply(this, arguments); };
        const R = window.setupRoll; window.setupRoll = function (type, pl) { try { if (T && type === 'THROW TEAMMATE') T.rolled = true; if (T && type === 'LANDING') T.rs = true; } catch (e) {} return R.apply(this, arguments); };
        const L = window.log; window.log = function (m) { try { const s = String(m); if (T) { if (/SUPERB THROW/.test(s)) T.res = 'SUPERB'; else if (/SUBPAR THROW/.test(s)) T.res = 'SUBPAR'; else if (/FUMBLED THROW/.test(s)) T.res = 'FUMBLE'; } } catch (e) {} return L.apply(this, arguments); };
        const CA = window.checkArmor; window.checkArmor = function (pl) { try { if (T && pl && pl.team !== T.team) T.hurt = true; } catch (e) {} return CA.apply(this, arguments); };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { try { close(); } catch (e) {} return ST.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
        setTimeout(() => { try { TT.can = [0, 1].filter(t => state.players.some(q => q.team === t && (q.skills || []).some(s => /Throw Team.?Mate|Kick Team.?Mate/i.test(s)))).length; } catch (e) {} }, 3000);
      }, [race, FLAGS, JSON.parse(AIPJ)]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      const r = await p.evaluate(() => TT); out.throws.push(...r.throws); out.teamMatches += r.can; await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.throws.length} throws, ${out.teamMatches} team-matches with a thrower, written to ${OUT}`);
})();
