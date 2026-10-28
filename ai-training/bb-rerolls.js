// node ai-training/bb-rerolls.js RACES N OUT.json [FLAGS] [AIPjson]
// The BludBowl computer's team re-rolls, in the form fumbbl-rerolls.py --bb reads (mirror matches, ?simtest test mode).
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-rerolls.json', FLAGS = 'all', AIPJ = '{}'] = process.argv.slice(2);
const KIND = { DODGE: 'dodge', RUSH: 'rush', PICKUP: 'pick-up', CATCH: 'catch', PASS: 'pass', LANDING: 'landing', 'STAND UP': 'stand up', 'JUMP UP': 'stand up', INTERCEPT: 'interception', 'THROW TEAMMATE': 'throw team-mate', 'THROW BOMB': 'pass', JUMP: 'jump', LEAP: 'jump' };
(async () => {
  const b = await chromium.launch(); const out = { events: [], unusedL: [], matches: 0 }; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(([race, flags, aip, KIND]) => {
        if (flags !== 'all') AIX.flags = [flags.split(','), flags.split(',')];
        window.AIP = [aip, aip]; window.RR = { ev: [], unused: [] }; let ctx = null, blk = null;
        const cat = c => { const B = (c.atk.skills || []).includes('Block'), DB = (c.def.skills || []).includes('Block'), DD = (c.def.skills || []).includes('Dodge'), TK = (c.atk.skills || []).includes('Tackle');
          const f = x => x === 1 ? 0 : x === 2 ? (B ? (DB ? 1 : 2) : 0) : x === 3 || x === 4 ? 1 : x === 5 ? (!DD || TK ? 2 : 1) : 2;
          const v = (c.dice || []).map(f); const r = v.length ? (c.chooser === c.atk.team ? Math.max(...v) : Math.min(...v)) : 1; return ['down', 'nothing', 'kd'][r]; };
        const acted = t => state.players.filter(q => q.team === t && q.hasActed).length;
        const base = (pl, kind) => ({ kind, side: pl.team, race, turn: state.turn[pl.team], rr: state.rr[pl.team] || 0, act: acted(pl.team), avail: (state.rr[pl.team] || 0) > 0 && !state.teamRRUsedThisTurn,
          carrier: state.ball.carrierId === pl.id || ['pick-up', 'catch', 'pass'].includes(kind) });
        const L = window.log; window.log = function (m) { try { const s = String(m);
          if (ctx && /TEAM RE-ROLL used!/.test(s)) ctx.trr = true;
          if (ctx && / to re-roll!/.test(s)) ctx.skill = (s.match(/uses (.+?) to re-roll/) || [])[1] || 'skill';
          if (/TEAM RE-ROLL used for Block dice/.test(s) && state.combat && !state.combat._cat0) { state.combat._cat0 = cat(state.combat); state.combat._nd0 = (state.combat.dice || []).length; state.combat._trr = true; }
        } catch (e) {} return L.apply(this, arguments); };
        const SR = window.setupRoll; window.setupRoll = function (type, pl, tg, sk, onPass, onFail, ex) {
          if (!pl || pl.team !== state.activeTeam || !AI.isAI(pl.team) || !KIND[type]) return SR.apply(this, arguments);
          const c = Object.assign(base(pl, KIND[type]), { trr: false, skill: null }); ctx = c;
          const fin = ok => { if (ctx === c) ctx = null; if (c.done) return; c.done = true; const failedFirst = c.trr || c.skill || !ok; if (!failedFirst) return; RR.ev.push(Object.assign({}, c, { rerolled: c.skill ? c.skill : c.trr ? 'Team ReRoll' : null })); };
          return SR.call(this, type, pl, tg, sk, function () { fin(true); return onPass.apply(this, arguments); }, function () { fin(false); return onFail.apply(this, arguments); }, ex);
        };
        const TR = window.teamRerollable; window.teamRerollable = function (pl, label, pass, done, first) {
          let firstOk = null; const c = pl && AI.isAI(pl.team) && pl.team === state.activeTeam ? base(pl, 'Bone Head etc.') : null;
          return TR.call(this, pl, label, r => { const ok = pass(r); if (firstOk === null) firstOk = ok; return ok; }, r => { if (c && firstOk === false) RR.ev.push(Object.assign(c, { rerolled: null })); return done(r); }, first);
        };
        const RB = window.resolveBlock; window.resolveBlock = function () { try { const c = state.combat; if (c && !c._rr && AI.isAI(c.atk.team)) { c._rr = 1; if (blk) RR.ev.push(blk); blk = Object.assign(base(c.atk, 'block'), { trr: !!(c.aiRerolled || c._trr), cat: c._cat0 || cat(c), nd: c._nd0 || (c.dice || []).length }); if (c._trr) blk.avail = true; } } catch (e) {} return RB.apply(this, arguments); };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try { if (blk) { RR.ev.push(blk); blk = null; } const t = state.activeTeam; if (state.turn[t] >= TURNS) RR.unused.push(state.rr[t] || 0); } catch (e) {} return E.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, [race, FLAGS, JSON.parse(AIPJ), KIND]);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      const r = await p.evaluate(() => RR); out.events.push(...r.ev); out.unusedL.push(...r.unused); out.matches++; await p.close();
    }
  }));
  await b.close(); out.unused = out.unusedL.reduce((a, c) => a + c, 0) / Math.max(1, out.unusedL.length); delete out.unusedL;
  require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.events.length} events from ${out.matches} matches written to ${OUT}`);
})();
