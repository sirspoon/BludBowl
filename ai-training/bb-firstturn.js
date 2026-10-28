// node ai-training/bb-firstturn.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's first turn after receiving each kick-off (mirror matches, ?simtest test mode), in the form
// fumbbl-firstturn.py reads: python3 ai-training/fumbbl-firstturn.py --bb OUT.json. Needs a web server on :8765.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-firstturn.json', FLAGS = 'all', AIPJ = '{}'] = process.argv.slice(2);
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
        window.AIP = [aip, aip]; window.FT = []; let recv = null, T = null, lastPid = null;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const up = q => onP(q) && !q.isDown && !q.isStunned;
        const contact = q => state.players.some(o => o.team !== q.team && up(o) && Math.max(Math.abs(o.x - q.x), Math.abs(o.y - q.y)) === 1);
        const ev = (q, a) => { if (!T || !q || !T.players[q.id]) return; const v = T.players[q.id]; if (!v.acts.includes(a)) v.acts.push(a); if (q.id !== lastPid) { T.order.push([q.id, a]); lastPid = q.id; } else if (a === 'block') T.order[T.order.length - 1][1] = 'block'; };
        const finish = () => { if (!T) return; Object.entries(T.players).forEach(([id, v]) => { const q = getPlayerById(+id) || getPlayerById(id); v.contact1 = !!q && up(q) && contact(q); }); FT.push(T); T = null; };
        const SK = window.startKickoffSequence; window.startKickoffSequence = function (kt, rt) { finish(); recv = rt; return SK.apply(this, arguments); };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { const r = ST.apply(this, arguments); try {
          if (T && state.activeTeam !== T.team) finish();
          if (recv != null && state.activeTeam === recv && !state.isResolvingKickoff) {
            const ps = state.players.filter(q => q.team === recv && up(q));
            T = { race, team: recv, players: {}, order: [], pickupAt: null }; lastPid = null;
            ps.forEach(q => { T.players[q.id] = { contact0: contact(q), acts: [], dodges: 0, dodgeFail: 0, blocks: [], x0: q.x, y0: q.y }; });
            recv = null;
          }
        } catch (e) {} return r; };
        const RB = window.resolveBlock; window.resolveBlock = function () { const c = state.combat; try { if (T && c && !c._ft && c.atk.team === T.team) { c._ft = 1; ev(c.atk, 'block'); const n = (c.dice || []).length; T.players[c.atk.id] && T.players[c.atk.id].blocks.push(c.chooser === c.atk.team || n === 1 ? n : -n); } } catch (e) {} return RB.apply(this, arguments); };
        const SR = window.setupRoll; window.setupRoll = function (type, pl, tg, sk, onPass, onFail, ex) { try {
          if (T && pl && T.players[pl.id]) {
            if (type === 'DODGE') { T.players[pl.id].dodges++; (T.dodgers = T.dodgers || []).push(pl.type + (state.ball.carrierId === pl.id ? ' (carrier)' : '') + (state.blitzUsed && state.selectedId === pl.id ? ' (blitz)' : '') + (T.players[pl.id].acts.includes('block') ? ' (after a block)' : '')); ev(pl, 'move'); const of = onFail; onFail = function () { if (T && T.players[pl.id]) T.players[pl.id].dodgeFail++; return of.apply(this, arguments); }; }
            if (type === 'PICKUP' && T.pickupAt == null) T.pickupAt = T.order.length;
          } } catch (e) {} return SR.call(this, type, pl, tg, sk, onPass, onFail, ex); };
        const RN = window.render; window.render = function () { try { if (T) state.players.forEach(q => { const v = T.players[q.id]; if (v && (q.x !== v.x0 || q.y !== v.y0) && !v.moved) { v.moved = true; ev(q, 'move'); } }); } catch (e) {} return RN.apply(this, arguments); };
        window.__finish = finish;
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, FLAGS, JSON.parse(AIPJ)]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => FT)); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.length} first turns written to ${OUT}`);
})();
