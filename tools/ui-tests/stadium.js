// Stadium & dugouts (test, ?stadium): each team's dugout shows the right players after a KO, a casualty (once the player has
// faded off the pitch), a KO'd player coming back, and a tap on a dugout player opens their stats; the setting; never in ?simtest.
// node tools/ui-tests/stadium.js [outDir]
const { chromium, OUT, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  const { page, errors } = await openGame(browser, { query: '?stadium', viewport: { width: 1280, height: 800 } });
  await page.evaluate(() => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
  for (let i = 0; i < 300; i++) {
    await page.waitForTimeout(200);
    const ok = await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
      return state.turn[0] >= 1 && state.players.filter(p => p.team === 0 && p.x >= 0 && p.x < CFG.cols && !p.isFading).length >= 3; });
    if (ok) break;
  }
  await page.evaluate(() => { CLOCK.set(1); AI.setPaused(true); ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll', 'modal-announce'].forEach(id => document.getElementById(id).classList.add('hidden')); });
  check(await page.evaluate(() => STADIUM.active() && PITCH.style === 'blades'), '?stadium: on, on the grass pitch');
  const ids = await page.evaluate(() => {
    const on = state.players.filter(p => p.team === 0 && p.x >= 0 && p.x < CFG.cols && !p.isFading && !p.isCasualty && !p.isKO);
    const occ = STADIUM.occupants(0), base = { res: occ.res.length, ko: occ.ko.length, cas: occ.cas.length };
    // a KO, as the game does it (removePlayerWithFade, then off the pitch once the fade ends)
    const a = on[0], b = on[1];
    a.isKO = true; a.inSquad = false; removePlayerWithFade(a, 'KNOCKED OUT', "KO'd - test", false);
    b.isCasualty = true; b.casualtyStatus = 'Dead'; removePlayerWithFade(b, 'CASUALTY', 'Dead - test', false);
    const during = STADIUM.occupants(0);
    return { a: a.id, b: b.id, base, koDuring: during.ko.some(p => p.id === a.id) };
  });
  check(!ids.koDuring, 'a KO\'d player still fading off the pitch is not in the dugout yet');
  await page.waitForTimeout(2600);
  const after = await page.evaluate(({ a, b }) => { finishFades(); render(); const o = STADIUM.occupants(0), o1 = STADIUM.occupants(1);
    return { ko: o.ko.map(p => p.id), cas: o.cas.map(p => p.id), res: o.res.map(p => p.id), other: [...o1.ko, ...o1.cas].map(p => p.id), boxes: STADIUM.boxes().map(x => x.id) }; }, ids);
  check(after.ko.includes(ids.a) && !after.res.includes(ids.a), "the KO'd player is in their team's Knocked Out bay", after.ko);
  check(after.cas.includes(ids.b), 'the dead player is in the Casualties bay', after.cas);
  check(!after.other.includes(ids.a) && !after.other.includes(ids.b), "and not in the other team's dugout");
  check(after.boxes.includes(ids.a) && after.boxes.includes(ids.b), 'both are drawn (tap boxes) in the dugout');
  // a tap on the KO'd player in the dugout: show the dugout, then click on them
  // (the game ignores taps on the pitch while the computer decides: a person coaches both sides from here)
  const pt = await page.evaluate(a => { AI.set(0, false); AI.set(1, false); const d = STADIUM.dugRect(0), ts = CFG.tileSize, z = 1.1; state.camera.zoom = z;
    state.camera.x = innerWidth / 2 - (d.x + d.w / 2) * ts * z; state.camera.y = innerHeight / 2 - (d.y + d.h / 2) * ts * z; camUserAt = performance.now() + 1e7; render();
    const bx = STADIUM.boxes().find(x => x.id === a); return { x: state.camera.x + (bx.x + bx.w / 2) * z, y: state.camera.y + (bx.y + bx.h / 2) * z }; }, ids.a);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(300);
  // (a dice result still showing takes the first tap to put it away, as in play)
  if (!/In the dugout/.test(await page.evaluate(() => document.getElementById('stats-panel').textContent))) { await page.waitForTimeout(500); await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(300); }
  const panel = await page.evaluate(() => ({ t: document.getElementById('stats-panel').textContent.replace(/\s+/g, ' '), tb: document.getElementById('action-toolbar').classList.contains('hidden') }));
  check(/In the dugout: Knocked out/.test(panel.t) && panel.tb, 'tapping a dugout player shows them in the Unit Panel (no action buttons)', panel.t.slice(0, 120));
  await page.screenshot({ path: OUT + '/stadium-dugout.png' });
  // back on a 4+: from the KO bay to the reserves
  const back = await page.evaluate(a => { const p = getPlayerById(a); p.isKO = false; p.isReserve = true; p.x = -9; p.y = -9; render(); const o = STADIUM.occupants(0); return { res: o.res.some(q => q.id === a), ko: o.ko.some(q => q.id === a) }; }, ids.a);
  check(back.res && !back.ko, 'a KO\'d player who comes round moves to Reserves', back);
  // the setting
  const st = await page.evaluate(() => { localStorage.removeItem('bb-stadium'); STADIUM.set(false); const q = STADIUM.query; STADIUM.set(true); const v = localStorage.getItem('bb-stadium'); STADIUM.set(false); return { q, v, off: localStorage.getItem('bb-stadium') }; });
  check(st.v === '1' && st.off === '0', 'Settings switch saves bb-stadium', st);
  check(!errors.length, 'no page errors', errors.slice(0, 3));
  // ?simtest: never drawn
  const s2 = await openGame(browser, { query: '?simtest&stadium' });
  check(await s2.page.evaluate(() => !STADIUM.active()), 'not drawn in ?simtest');
  await done(browser);
})();
