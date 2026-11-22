// Screenshots of a match on the classic grass pitch at desktop, phone portrait (~400 px) and phone landscape.
// node tools/stadium-test/shots.js <prefix> [query]   e.g. node tools/stadium-test/shots.js after '?stadium'
const { chromium, devices } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), OUT = __dirname;
const prefix = process.argv[2] || 'shot', query = process.argv[3] || '';
const SIZES = [['desktop', { viewport: { width: 1366, height: 768 } }], ['portrait', { viewport: { width: 400, height: 860 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['landscape', { viewport: { width: 860, height: 400 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]];
(async () => {
  const browser = await chromium.launch();
  for (const [name, o] of SIZES) {
    const ctx = await browser.newContext(o), page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto('file://' + path.join(ROOT, 'index.html') + query);
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const s = document.getElementById('splash'); if (s) s.style.display = 'none'; localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-pitch', 'blades');
      setPitchPref('blades'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
    // let the computer play a while so some players are knocked out / hurt
    for (let i = 0; i < 300; i++) {
      await page.waitForTimeout(200);
      const ok = await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
        return (state.turn[0] >= 4 && state.players.some(p => p.isKO || p.isCasualty)) || state.turn[0] >= 7; });
      if (ok) break;
    }
    await page.evaluate(() => { CLOCK.set(1); AI.setPaused(true); });
    await page.waitForTimeout(2500);
    // the game's own starting view (resizeCanvas), held still, then zoomed out to see the surroundings
    await page.evaluate(() => { camTween = null; resizeCanvas(); camUserAt = performance.now() + 1e7; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${prefix}-${name}.png`) });
    if (name !== 'portrait') {
      await page.evaluate(() => { const W = innerWidth, H = innerHeight, z = Math.max(0.4, Math.min(W / (CFG.cols * CFG.tileSize + 300), H / (CFG.rows * CFG.tileSize + 420)));
        state.camera.zoom = z; state.camera.x = (W - CFG.cols * CFG.tileSize * z) / 2; state.camera.y = (H - CFG.rows * CFG.tileSize * z) / 2; });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `${prefix}-${name}-zoomed-out.png`) });
    }
    console.log(name, errs.length ? errs.slice(0, 2) : 'ok');
    await ctx.close();
  }
  await browser.close();
})();
