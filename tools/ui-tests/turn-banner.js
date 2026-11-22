// The "TEAM'S TURN" banner after the computer's sped-up turn (Speed up, 4x): it must stay up its full ~1.9 s for the coach,
// not a quarter of that (v5.60: the clock was still at 4x when the banner's timer was set).
// node tools/ui-tests/turn-banner.js [outDir]
const { chromium, OUT, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  const { page, errors } = await openGame(browser, { device: 'Pixel 7' });
  await page.evaluate(() => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(250);
    const ok = await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
      return state.turn[0] >= 1 && state.turn[1] >= 1 && [MODES.IDLE, MODES.SELECT].includes(state.mode); });
    if (ok) break;
  }
  // the person coaches team 0, the computer team 1; the computer's turn has been running at 4x and now hands over
  const ms = await page.evaluate(async () => {
    AI.set(0, false); AI.set(1, true); AI.setPaused(true);
    ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll', 'modal-announce'].forEach(id => document.getElementById(id).classList.add('hidden'));
    state.activeTeam = 1; CLOCK.set(4);
    state.activeTeam = 0; startTurnPhase();
    const el = document.getElementById('turn-banner'), t0 = CLOCK.real(), speed = CLOCK.speed;
    while (!el.classList.contains('hidden') && CLOCK.real() - t0 < 4000) await new Promise(r => requestAnimationFrame(r));
    return { shown: Math.round(CLOCK.real() - t0), speed, title: el.querySelector('.tb-title').textContent };
  });
  await page.screenshot({ path: OUT + '/turn-banner.png' });
  check(ms.shown >= 1700 && ms.shown <= 2600 && ms.speed === 1, "after the computer's 4x turn the coach's turn banner stays up its full time, at normal speed", ms);
  check(!errors.length, 'no page errors', errors.slice(0, 3));
  await done(browser);
})();
