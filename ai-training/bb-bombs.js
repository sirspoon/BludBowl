// node ai-training/bb-bombs.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's bombs, in the form fumbbl-bombs.py --bb reads (mirror matches, ?simtest test mode).
// FLAGS: '' for every AI switch on, or a comma-separated list.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-bombs.json', FLAGS = '', AIPJ = '{}'] = process.argv.slice(2);
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
        const ROLES = ['Big Guy', 'Blitzer', 'Catcher', 'Thrower', 'Runner', 'Blocker', 'Lineman'];
        const role = q => (q.st >= 5 ? 'Big Guy' : ROLES.find(r => (q.type || '').includes(r.split(' ')[0])) || ((q.type || '').match(/Line/) ? 'Lineman' : 'Special'));
        const hit = q => q.isDown || q.isStunned || q.isKO || q.isCasualty;
        // what the bomb did: looked at when the next player is activated (or the turn ends), as fumbbl-bombs.py does
        const outcome = () => { if (!T || T.up0 == null) return;
          T.kd = T.up0.filter(q => q.team !== T.team && hit(q)).length; T.ownKd = T.up0.filter(q => q.team === T.team && hit(q)).length; T.turnover = T.ownKd > 0;
          T.ballLoose = !!(T.c0 && T.c0.team !== T.team && state.ball.carrierId !== T.c0.id); T.rr = (state.rr[T.team] || 0) < T.rr0 || T.rr;
          delete T.up0; delete T.c0; delete T.rr0; };
        const close = () => { if (!T) return; outcome(); T.n = Math.max(T.idx + 1, state.players.filter(q => q.team === T.team && q.hasActed).length);
          T.side = T.team; TT.throws.push(T); T = null; };
        const DA = window.declareAction; window.declareAction = function () { try { outcome(); } catch (e) {} return DA.apply(this, arguments); };
        const ET = window.endTeamTurn; window.endTeamTurn = function () { try { close(); } catch (e) {} return ET.apply(this, arguments); };
        const X = window.throwBomb; window.throwBomb = function (thrower, tx, ty, penalty, re) { try { if (!re && AI.isAI(thrower.team)) { close();
          const me = thrower.team, c = state.ball.carrierId && getPlayerById(state.ball.carrierId);
          const near = state.players.filter(q => onP(q) && cheb(q, { x: tx, y: ty }) <= 1).map(q => ({ own: q.team === me, up: !q.isDown && !q.isStunned, carrier: !!c && q.id === c.id, d: cheb(q, { x: tx, y: ty }),
            type: q.type, role: role(q), st: q.st, av: q.av, skills: (q.skills || []).filter(s => ['Block', 'Dodge', 'Guard', 'Sure Hands', 'Stand Firm', 'Sidestep'].includes(s)) }));
          const theirC = c && c.team !== me && onP(c);
          const od = state.players.filter(q => q.team !== me && onP(q) && !q.isDown && !q.isStunned).map(q => cheb(q, thrower));
          T = { oppD: od.length ? Math.min(...od) : 99, race, team: me, turn: state.turn[me], thrower: thrower.type, idx: state.players.filter(q => q.team === me && q.hasActed && q.id !== thrower.id).length,
            dist: ['Quick Pass', 'Short Pass', 'Long Pass', 'Long Bomb'][penalty] || '?', target: [tx, ty], near, ball: theirC ? 'theirs' : (c && onP(c)) ? 'ours' : 'loose', theirC: !!theirC,
            carrierD: theirC ? cheb(c, { x: tx, y: ty }) : null, up0: state.players.filter(q => onP(q) && !q.isDown && !q.isStunned), c0: c && onP(c) ? c : null,
            rr0: state.rr[me] || 0, rr: false, res: null, hurt: 0, cas: 0, turnover: false }; } } catch (e) {} return X.apply(this, arguments); };
        const L = window.log; window.log = function (m) { try { const s = String(m); if (T && !T.res) { if (/sails right on target/.test(s)) T.res = 'ACCURATE'; else if (/FUMBLE! The bomb slips/.test(s)) T.res = 'FUMBLE'; else if (/throw is off target/.test(s)) T.res = 'INACCURATE'; }
          if (T && /re-?roll/i.test(s) && /Pro|Pass|skill/i.test(s)) T.rr = true; } catch (e) {} return L.apply(this, arguments); };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { try { close(); } catch (e) {} const r = ST.apply(this, arguments);
          try { const me = state.activeTeam; if (state.players.some(q => q.team === me && onP(q) && !q.isDown && !q.isStunned && (q.skills || []).includes('Bombardier'))) TT.ready = (TT.ready || 0) + 1; } catch (e) {} return r; };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
        setTimeout(() => { try { TT.can = [0, 1].filter(t => state.players.some(q => q.team === t && (q.skills || []).includes('Bombardier'))).length; } catch (e) {} }, 3000);
      }, [race, FLAGS, JSON.parse(AIPJ)]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      const r = await p.evaluate(() => TT); out.throws.push(...r.throws); out.teamMatches += r.can; out.ready = (out.ready || 0) + (r.ready || 0); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.throws.length} bombs, ${out.teamMatches} team-matches with a bomber, written to ${OUT}`);
})();
