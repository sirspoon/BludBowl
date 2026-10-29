// node ai-training/bb-lateturns.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's last two turns of a half with the ball, in the form late-turns.py --bb reads (mirror matches,
// ?simtest test mode). FLAGS: '' for every AI switch on, or a comma-separated list.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-lateturns.json', FLAGS = '', AIPJ = '{}'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(([race, flags, aip]) => {
        if (flags) AIX.flags = [flags.split(','), flags.split(',')];
        window.AIP = [aip, aip]; window.LT = []; let T = null;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const carrier = () => { const c = state.ball.carrierId && getPlayerById(state.ball.carrierId); return c && onP(c) && !c.isDown ? c : null; };
        const close = () => { if (!T) return; const s = (state.score[T.team] || 0) - T.s0, c = carrier();
          T.out = s > 0 ? 'td' : T.to ? 'turnover' : c && c.team === T.team ? 'short' : 'lost';
          if (s > 0) T.how = T.ttm ? 'thrown team-mate' : T.pass ? 'pass' : T.ho ? 'hand-off' : 'ran in';
          delete T.s0; LT.push(T); T = null; };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { close(); const r = ST.apply(this, arguments); try {
          const t = state.activeTeam, tn = state.turn[t], c = carrier();
          if (!state.isResolvingKickoff && AI.isAI(t) && (tn === TURNS || tn === TURNS - 1) && c && c.team === t)
            T = { race, team: t, turn: tn === TURNS ? 8 : 7, toGo: Math.abs(c.x - (t === 0 ? CFG.cols - 1 : 0)), ma: c.ma, s0: state.score[t] || 0, to: false };
        } catch (e) {} return r; };
        const SR = window.setupRoll; window.setupRoll = function (type, pl) { try { if (T && pl && pl.team === T.team) { if (type === 'THROW TEAMMATE') T.ttm = 1; if (type === 'PASS') T.pass = 1; if (type === 'CATCH' && !state.passData) T.ho = 1; } } catch (e) {} return SR.apply(this, arguments); };
        const TO = window.triggerTurnover; window.triggerTurnover = function () { try { if (T && state.activeTeam === T.team) T.to = true; } catch (e) {} return TO.apply(this, arguments); };
        const CT = window.checkTouchdown; window.checkTouchdown = function () { const r = CT.apply(this, arguments); return r; };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try { if (T && state.activeTeam === T.team) close(); } catch (e) {} return E.apply(this, arguments); };
        const SK = window.startKickoffSequence; window.startKickoffSequence = function () { try { close(); } catch (e) {} return SK.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, FLAGS, JSON.parse(AIPJ)]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => LT)); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.length} turns written to ${OUT}`);
})();
