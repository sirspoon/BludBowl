// node ai-training/bb-blitz.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's blitzes, in the form fumbbl-blitz.py --bb reads (mirror matches, ?simtest test mode).
// FLAGS: '' for every AI switch on, or a comma-separated list.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-blitz.json', FLAGS = '', AIPJ = '{}'] = process.argv.slice(2);
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
        window.AIP = [aip, aip]; window.BZ = []; let T = null, last = null; const pos0 = new Map(), seen = new Map();
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const cheb = (a, c) => Math.max(Math.abs(a.x - c.x), Math.abs(a.y - c.y));
        const carrier = () => { const c = state.ball.carrierId && getPlayerById(state.ball.carrierId); return c && onP(c) && !c.isDown ? c : null; };
        const close = () => { if (T && T.n >= 2) BZ.push(T); T = null; last = null; };
        const act = q => { if (!T || !q || q.team !== T.team) return; if (last !== q.id) { T.n++; last = q.id; } if (state.blitzUsed && !T.blitz && q.actionTaken === 'blitz') T.blitz = { pid: q.id, at: T.n, from: pos0.get(q.id), dodges: 0, rushes: 0, blocked: false, kd: false, st: q.st, ma: q.ma, hasBlock: (q.skills || []).includes('Block'), pos: q.type }; };
        const ST = window.startTurnPhase; window.startTurnPhase = function () { close(); const r = ST.apply(this, arguments); try {
          if (!state.isResolvingKickoff && AI.isAI(state.activeTeam)) { const c = carrier(); T = { race, team: state.activeTeam, n: 0, blitz: null, ball: c ? (c.team === state.activeTeam ? 'ours' : 'theirs') : 'loose' };
            state.players.forEach(q => { pos0.set(q.id, [q.x, q.y]); seen.set(q.id, q.x + ',' + q.y); }); }
        } catch (e) {} return r; };
        const RN = window.render; window.render = function () { try { if (T) state.players.forEach(q => { if (!onP(q)) return; const k = q.x + ',' + q.y; if (seen.get(q.id) !== k) { seen.set(q.id, k); if (q.team === T.team) act(q); } }); } catch (e) {} return RN.apply(this, arguments); };
        const SR = window.setupRoll; window.setupRoll = function (type, pl) { try { if (T && pl && pl.team === T.team) { act(pl); const b = T.blitz; if (b && b.pid === pl.id && !b.blocked) { if (type === 'DODGE') b.dodges++; if (type === 'RUSH') b.rushes++; } } } catch (e) {} return SR.apply(this, arguments); };
        const RB = window.resolveBlock; window.resolveBlock = function () { try { const c = state.combat; if (T && c && !c._bz && c.atk.team === T.team) { c._bz = 1; act(c.atk); const b = T.blitz;
          if (b && b.pid === c.atk.id && !b.blocked) {
            b.blocked = true; b.target = c.def.id; const f = b.from; b.dist = f ? Math.max(Math.abs(c.atk.x - f[0]), Math.abs(c.atk.y - f[1])) : null;
            const n = (c.dice || []).length; b.dice = c.chooser === c.atk.team || n === 1 ? n : -n;
            const cc = carrier(), ourC = cc && cc.team === T.team ? cc : null, theirC = cc && cc.team !== T.team ? cc : null;
            b.role = theirC && theirC.id === c.def.id ? 'carrier' : ourC && cheb(c.def, ourC) === 1 ? 'marking our carrier' : theirC && cheb(c.def, theirC) === 1 ? 'next to their carrier' : 'other';
            b.tst = c.def.st; b.tblock = (c.def.skills || []).includes('Block'); b.tline = c.def.x === 12 || c.def.x === 13;
            b.ourAdj = state.players.filter(q => q.team === T.team && q.id !== c.atk.id && onP(q) && !q.isDown && !q.isStunned && cheb(q, c.def) === 1).length; b.edge = Math.min(c.def.y, CFG.rows - 1 - c.def.y); b.tpos = c.def.type; b.tav = c.def.av; b.tma = c.def.ma;
            const bl = cc ? cc : state.ball.x >= 0 ? { x: state.ball.x, y: state.ball.y } : null; b.ballD = bl ? cheb(c.def, bl) : null;
          } } } catch (e) {} return RB.apply(this, arguments); };
        const CA = window.checkArmor; window.checkArmor = function (pl) { try { if (T && T.blitz && T.blitz.blocked && pl && pl.id === T.blitz.target) T.blitz.kd = true; } catch (e) {} return CA.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, FLAGS, JSON.parse(AIPJ)]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => BZ)); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.length} turns written to ${OUT}`);
})();
