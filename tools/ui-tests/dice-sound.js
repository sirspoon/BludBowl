// Dice sound (v5.71, sound G from tools/dice-prototype/sounds.html) in step with the animated dice:
// - each die's landing is scheduled on its touchdown and the pattern's strong second hit on the hop's landing (within 20 ms),
//   for 1, 2 and 3 dice and roll lengths 0.5 / 1.0 / 2.0 s (checked against the times the animation itself works to and
//   the frames where it lands / finishes the hop);
// - tumbling dice rattle; the rattle stops at once on Roll, a closed window, a hidden tab; a skip cuts the landing to one hit;
// - nothing is scheduled in ?simtest.
// node tools/ui-tests/dice-sound.js [outDir]
const { chromium, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

  // ---- timing: a tray on its own, settle with each roll length and number of dice
  {
    const { page, ctx, errors } = await openGame(browser);
    await page.evaluate(() => { localStorage.setItem('bb-sound-muted', '0'); SFX.setMuted(false); SFX.unlock();
      const h = document.createElement('div'); h.id = 'snd-host'; h.style.cssText = 'position:fixed;left:20px;top:20px;width:300px;height:80px;z-index:99999;background:#123'; document.body.appendChild(h); });
    for (const dur of [500, 1000, 2000]) for (const n of [1, 2, 3]) {
      const r = await page.evaluate(async ([dur, n]) => {
        localStorage.setItem('bb-dice-dur', String(dur));
        const host = document.getElementById('snd-host'), L = SFX.dice.log; L.length = 0;
        const T = DICEFX.tray(host, { n, kind: 'block', size: 50, gap: 10, height: 60 });
        DICEFX.tumble(T);
        await new Promise(r => setTimeout(r, 250));
        const rattled = DICEFX.rattling(T) && L.some(e => e.kind === 'rattle');
        const vals = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)), tSettle = CLOCK.real();
        await new Promise(res => DICEFX.settle(T, vals, null, res));
        const stopAt = (L.find(e => e.kind === 'stop') || {}).at, stillRattling = DICEFX.rattling(T);
        const J = .62, out = T.dice.map((d, i) => {
          const land = L.filter(e => e.kind === 'land' && e.die === i), a = land.find(e => e.i === 0), b = land.find(e => e.i === 3);
          const td = T.t0 + d.start + d.len * J, hop = td + d.len * (1 - J) * .75;
          return { calc: [a ? +(a.at - td).toFixed(2) : null, b ? +(b.at - hop).toFixed(2) : null],
                   frame: [a && d.landedAt ? +(d.landedAt - a.at).toFixed(1) : null, b && d.hopAt ? +(d.hopAt - b.at).toFixed(1) : null], hits: land.length };
        });
        DICEFX.stop(T);
        return { out, rattled, stopped: stopAt != null && stopAt - tSettle < 5 && !stillRattling, total: L.filter(e => e.kind === 'land').length };
      }, [dur, n]);
      const calcOk = r.out.every(o => o.calc.every(v => v != null && Math.abs(v) <= 1));
      // (the frame showing the landing comes up to a frame after the moment itself - headless frames can be late - so: within 2 frames)
      const frameOk = r.out.every(o => o.frame.every(v => v != null && v >= -2 && v <= 34));
      check(calcOk && frameOk, `${n} ${n === 1 ? 'die' : 'dice'}, ${dur / 1000} s roll: each die's first hit on its touchdown, the strong hit on its hop's landing (scheduled v the animation's own times, within 1 ms; v the frames it drew, within 2 frames)`,
        r.out.map(o => `calc ${o.calc.join('/')} frame ${o.frame.join('/')}`).join('; '));
      check(r.rattled && r.stopped, `${n} ${n === 1 ? 'die' : 'dice'}, ${dur / 1000} s: rattle while tumbling, stopped the moment they're rolled`, r);
      if (dur === 1000) check(n === 1 || r.total < n * 18 * .85, `${n} dice share the landing pattern out (not ${n} full patterns)`, { hits: r.total, full: n * 18 });
    }
    // a tap during the roll: the scheduled landing goes, one hit instead
    const sk = await page.evaluate(async () => {
      localStorage.setItem('bb-dice-dur', '2000');
      const host = document.getElementById('snd-host'), L = SFX.dice.log; L.length = 0;
      const T = DICEFX.tray(host, { n: 2, kind: 'block', size: 50, gap: 10, height: 60 }); DICEFX.tumble(T);
      await new Promise(r => setTimeout(r, 150));
      DICEFX.settle(T, [1, 2], null, () => {});
      await new Promise(r => setTimeout(r, 200));
      const n0 = L.length; DICEFX.finish(T); const after = L.slice(n0).map(e => e.kind);
      DICEFX.stop(T); return after;
    });
    check(sk.includes('stop') && sk.filter(k => k === 'hit').length === 1, 'a tap during the roll cuts the scheduled landing and plays one hit', sk);
    // closing the window (clearBox) and hiding the tab stop a waiting rattle
    const cl = await page.evaluate(async () => {
      const host = document.getElementById('snd-host');
      const T = DICEFX.waitIn(host, 1, null, () => {}, 'Tap the die to roll');
      await new Promise(r => setTimeout(r, 200)); const was = DICEFX.rattling(T);
      DICEFX.clearBox(host); const now = DICEFX.rattling(T);
      host.classList.remove('hidden');
      const T2 = DICEFX.waitIn(host, 1, null, () => {}, ''); await new Promise(r => setTimeout(r, 200)); const was2 = DICEFX.rattling(T2);
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
      const hid = DICEFX.rattling(T2);
      await new Promise(r => setTimeout(r, 100)); const hid2 = DICEFX.rattling(T2);
      delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 150)); const back = DICEFX.rattling(T2);
      DICEFX.clearBox(host);
      return { was, now, was2, hid, hid2, back };
    });
    check(cl.was && !cl.now, 'a waiting rattle stops when the window is cleared', cl);
    check(cl.was2 && !cl.hid && !cl.hid2 && cl.back, 'a hidden tab silences the rattle; it comes back with the tab', cl);
    // muted: nothing scheduled
    const mu = await page.evaluate(async () => { SFX.setMuted(true); const L = SFX.dice.log; L.length = 0; const host = document.getElementById('snd-host');
      const T = DICEFX.tray(host, { n: 2, kind: 'block', size: 50 }); DICEFX.tumble(T); await new Promise(r => setTimeout(r, 150));
      await new Promise(res => DICEFX.settle(T, [3, 4], null, res)); DICEFX.stop(T); sfx('dice'); await new Promise(r => setTimeout(r, 50)); SFX.setMuted(false); return L.length; });
    check(mu === 0, 'muted: no dice sound scheduled', mu);
    check(!errors.length, 'no page errors (timing page)', errors);
    await ctx.close();
  }

  // ---- the block window in a match: Roll and closing the window stop the rattle
  {
    const { page, ctx, errors } = await openGame(browser, { viewport: { width: 412, height: 860 } });
    await page.evaluate(() => { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-dice-dur', '600'); localStorage.setItem('bb-sound-muted', '0'); SFX.setMuted(false); SFX.unlock();
      AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
    for (let i = 0; i < 400; i++) {
      await page.waitForTimeout(250);
      const ok = await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
        return state.turn[0] >= 1 && state.turn[1] >= 1 && [MODES.IDLE, MODES.SELECT].includes(state.mode); });
      if (ok) break;
    }
    await page.evaluate(() => {
      AI.set(0, false); AI.set(1, false); CLOCK.set(1);
      window.__scene = () => {
        ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden'));
        state.players.forEach(p => { p.x = -10; p.y = -10; p.isReserve = true; });
        const a = state.players.find(p => p.team === 0 && p.type === 'Lineman' && !p.isCasualty && !p.isKO);
        const d = state.players.find(p => p.team === 1 && p.type === 'Lineman' && !p.isCasualty && !p.isKO);
        const h = state.players.find(p => p.team === 0 && p.type === 'Lineman' && p !== a && !p.isCasualty && !p.isKO);
        const fresh = (p, x, y) => Object.assign(p, { x, y, isReserve: false, isDown: false, isStunned: false, isDistracted: false, hasActed: false, hasBlocked: false, actionTaken: 'block', usedSkills: [] });
        fresh(a, 10, 7); fresh(d, 11, 7); fresh(h, 12, 8);
        Object.assign(state.ball, { carrierId: null, x: 25, y: 14 });
        Object.assign(state, { activeTeam: 0, mode: MODES.IDLE, teamRRUsedThisTurn: false }); state.rr[0] = 0; state.combat = null;
        return [a.id, d.id];
      };
      localStorage.setItem('bb-dice-anim-block', '1'); localStorage.setItem('bb-dice-anim-other', '1');
    });
    await page.waitForTimeout(300);
    const r = await page.evaluate(async () => {
      const L = SFX.dice.log; L.length = 0;
      let [a, d] = __scene(); startBlock(a, d);
      await new Promise(r => setTimeout(r, 300));
      const T = state.combat.dfx, waiting = DICEFX.rattling(T);
      document.querySelector('#dice-container .dfx-tray').click();
      const afterRoll = DICEFX.rattling(T), lands = () => L.filter(e => e.kind === 'land').length;
      await new Promise(r => setTimeout(r, 900));
      const landed = lands();
      // a second block: the window shut while the dice wait
      [a, d] = __scene(); startBlock(a, d);
      await new Promise(r => setTimeout(r, 300));
      const T2 = state.combat.dfx, waiting2 = DICEFX.rattling(T2);
      document.getElementById('modal-dice').classList.add('hidden');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const afterClose = DICEFX.rattling(T2);
      return { waiting, afterRoll, landed, waiting2, afterClose };
    });
    check(r.waiting && !r.afterRoll && r.landed >= 2, 'block dice: rattle while waiting, stopped the moment Roll is tapped, then the landings', r);
    check(r.waiting2 && !r.afterClose, 'block dice: closing the window stops the rattle', r);
    check(!errors.length, 'no page errors (match)', errors);
    await ctx.close();
  }

  // ---- ?simtest: no dice sound at all
  {
    const { page, ctx } = await openGame(browser, { query: '?simtest' });
    const r = await page.evaluate(async () => {
      localStorage.setItem('bb-sound-muted', '0'); SFX.setMuted(false);
      const L = SFX.dice.log; L.length = 0;
      const h = document.createElement('div'); h.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:80px'; document.body.appendChild(h);
      const T = DICEFX.tray(h, { n: 2, kind: 'block', size: 50 }); DICEFX.tumble(T); await new Promise(r => setTimeout(r, 150));
      DICEFX.settle(T, [1, 2], null, () => {}); sfx('dice'); sfx('diceClack');
      await new Promise(r => setTimeout(r, 1300));
      return { log: L.length, group: SFX.dice.group(2), rat: SFX.dice.rattle(2) };
    });
    check(r.log === 0 && r.group === null && r.rat === null, '?simtest: nothing scheduled, no rattle, no landing', r);
    await ctx.close();
  }
  await done(browser);
})();
