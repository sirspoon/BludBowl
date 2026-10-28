// node ai-training/bb-turnorder.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's turn order, in the form turnorder.py --bb reads (mirror matches, ?simtest test mode).
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-turnorder.json', FLAGS = 'all', AIPJ = '{}'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(([race, flags, aip]) => {
        if (flags !== 'all') AIX.flags = [flags.split(','), flags.split(',')];
        window.AIP = [aip, aip]; window.TT = []; let acts = [], team = null, turnover = false, left = null; const pos = new Map();
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const label = a => a.foul ? 'foul' : a.ball ? 'ball:' + (a.bk || '?') : a.blocks ? 'block' : (a.dodges || a.rushes) ? 'dodge/rush' : 'free';
        const ev = (pl, f) => { if (!pl || pl.team !== state.activeTeam || state.isResolvingKickoff) return; if (team !== pl.team) { acts = []; team = pl.team; }
          let a = acts[acts.length - 1]; if (!a || a.id !== pl.id) { a = { id: pl.id, blocks: 0, dodges: 0, rushes: 0, ball: 0, foul: 0 }; acts.push(a); } if (f) f(a); };
        const close = () => { if (acts.length && team != null) TT.push({ race, acts: acts.map(label), turnover, left: turnover ? left : null }); acts = []; team = null; turnover = false; left = null; };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { close(); state.players.forEach(q => pos.set(q.id, q.x + ',' + q.y)); return ST.apply(this, arguments); };
        const RN = window.render; window.render = function () { try { state.players.forEach(q => { if (!onP(q)) return; const k = q.x + ',' + q.y, was = pos.get(q.id); if (was !== undefined && was !== k && q.team === state.activeTeam) ev(q); pos.set(q.id, k); }); } catch (e) {} return RN.apply(this, arguments); };
        const SR = window.setupRoll; window.setupRoll = function (type, pl) { try {
          if (type === 'DODGE') ev(pl, a => a.dodges++); else if (type === 'RUSH') ev(pl, a => a.rushes++); else if (type === 'PICKUP' || type === 'PASS' || type === 'THROW TEAMMATE') ev(pl, a => { a.ball = 1; a.bk = a.bk || (type === 'PICKUP' ? 'pick-up' : type === 'PASS' ? 'pass' : 'ttm'); });
          else if (type === 'CATCH' && pl && pl.team === state.activeTeam && acts.length) { const a = acts[acts.length - 1]; if (a.id !== pl.id) { a.ball = 1; a.bk = a.bk || (state.passData ? 'pass' : 'hand-off'); } }
        } catch (e) {} return SR.apply(this, arguments); };
        const RB = window.resolveBlock; window.resolveBlock = function () { try { const c = state.combat; if (c && !c._to) { c._to = 1; ev(c.atk, a => { a.blocks++; if (c.isFoul) a.foul = 1; }); } } catch (e) {} return RB.apply(this, arguments); };
        const L = window.log; window.log = function (m) { try { if (/fouls|FOUL!/i.test(String(m)) && state.selectedId) ev(getPlayerById(state.selectedId), a => { a.foul = 1; }); } catch (e) {} return L.apply(this, arguments); };
        const TO = window.triggerTurnover; window.triggerTurnover = function () { try { if (team === state.activeTeam && !turnover) { turnover = true; const ids = new Set(acts.map(a => a.id)); left = state.players.filter(q => q.team === team && onP(q) && !q.hasActed && !ids.has(q.id) && !q.isStunned).length; } } catch (e) {} return TO.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, FLAGS, JSON.parse(AIPJ)]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => TT)); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.length} turns written to ${OUT}`);
})();
