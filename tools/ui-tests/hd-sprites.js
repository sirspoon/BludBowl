// HD sprite test (64x64 High Elves behind ?hd / Settings > HD sprites): the grids are sound, only High Elves change, and
// before/after screenshots on the pitch (desktop, phone portrait, close-up). node tools/ui-tests/hd-sprites.js [outDir]
const { chromium, OUT, check, done, openGame } = require('./lib');
async function toPitch(page) {   // High Elves v Humans, both computer, until the kick-off has landed; then freeze
  await page.evaluate(() => { AI.set(0, true); AI.set(1, true); window.launchMatch('highelf', 'human', { replaceOk: true }); });
  const t0 = Date.now(); let on = false;
  while (Date.now() - t0 < 90000 && !(on = await page.evaluate(() => {
    const go = [...document.querySelectorAll('button')].find(b => b.offsetParent && /^start match$/i.test(b.textContent.trim())); if (go) go.click();
    return state.half >= 1 && state.turn[0] + state.turn[1] >= 1 && state.players.filter(p => p.x >= 0 && !p.isReserve).length >= 20; }))) await page.waitForTimeout(400);
  await page.evaluate(() => { AI.set(0, false); AI.set(1, false); state.players.forEach(p => { p.isDown = false; p.isStunned = false; }); });
  await page.waitForTimeout(3500);   // (the turn banner clears)
  return on;
}
async function shots(browser, tag, query) {
  // desktop
  let { page, errors, ctx } = await openGame(browser, { query, dsf: 2 });
  check(await toPitch(page), `${tag}: match reaches the pitch (desktop)`);
  await page.screenshot({ path: `${OUT}/${tag}-desktop.png` });
  // close-up: zoom right in on a High Elf (a Dragon Prince or White Lion if one is on)
  const box = await page.evaluate(() => {
    const on = state.players.filter(p => p.team === 0 && p.x >= 0 && !p.isReserve);
    const p = on.find(q => q.type === 'Dragon Prince') || on.find(q => q.type === 'White Lion') || on[0];
    const cv = document.getElementById('gameCanvas') || document.querySelector('canvas'), r = cv.getBoundingClientRect(), ts = CFG.tileSize;
    state.camera.zoom = 3; const W = r.width, H = r.height;
    state.camera.x = W / 2 - (p.x + 0.5) * ts * 3; state.camera.y = H / 2 - (p.y + 0.5) * ts * 3; render();
    return { x: r.left + W / 2 - ts * 3 * 1.3, y: r.top + H / 2 - ts * 3 * 0.95, w: ts * 3 * 2.6, h: ts * 3 * 1.5 };
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => render());
  await page.screenshot({ path: `${OUT}/${tag}-closeup.png`, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.w, height: box.h } });
  const info = await page.evaluate(() => {
    const he = state.players.find(p => p.team === 0), hu = state.players.find(p => p.team === 1);
    return { he: spriteCanvas(he, false).width, hu: spriteCanvas(hu, false).width, hd: HD.on };
  });
  check(info.he === (query ? 64 : 32) && info.hu === 32, `${tag}: High Elf sprite ${info.he}px wide, Humans ${info.hu}px`, info);
  check(!errors.length, `${tag}: no page errors (desktop)`, errors.slice(0, 2));
  await ctx.close();
  // phone, portrait
  ({ page, errors, ctx } = await openGame(browser, { device: 'Pixel 7', query }));
  check(await toPitch(page), `${tag}: match reaches the pitch (phone)`);
  await page.screenshot({ path: `${OUT}/${tag}-phone.png` });
  const pr = await page.evaluate(() => { const cv = document.getElementById('gameCanvas') || document.querySelector('canvas'), r = cv.getBoundingClientRect(), ts = CFG.tileSize * state.camera.zoom;
    return { x: r.left + state.camera.x, y: r.top + state.camera.y, w: ts * CFG.cols, h: ts * CFG.rows }; });
  await page.screenshot({ path: `${OUT}/${tag}-phone-pitch.png`, clip: { x: Math.max(0, pr.x), y: Math.max(0, pr.y), width: Math.min(pr.w, 412), height: pr.h } });
  check(!errors.length, `${tag}: no page errors (phone)`, errors.slice(0, 2));
  await ctx.close();
}
(async () => {
  const browser = await chromium.launch();
  const { page, errors, ctx } = await openGame(browser);
  const g = await page.evaluate(() => {
    const bad = [];
    Object.entries(SPRITES_HD).forEach(([race, set]) => Object.entries(set).forEach(([n, grid]) => {
      if (grid.length !== 64 || grid.some(r => r.length !== 64)) bad.push(n + ': not 64x64');
      const pal = Object.assign({}, SPRITE_FIXED, { k: 1, K: 1, d: 1, t: 1, T: 1, l: 1, '(': 1, ')': 1, '[': 1, ']': 1, '.': 1 });
      const miss = [...new Set(grid.join(''))].filter(c => !pal[c]); if (miss.length) bad.push(n + ': unknown letters ' + miss.join(''));
      if (!SPRITES[race][n]) bad.push(n + ': no 32x32 original');
    }));
    const missing = Object.keys(SPRITES.highelf).filter(n => !SPRITES_HD.highelf[n]);
    return { bad, missing, off: HD.on };
  });
  check(!g.bad.length, 'HD grids are 64x64 and use known palette letters', g.bad);
  check(!g.missing.length, 'every High Elf position has an HD sprite', g.missing);
  check(!g.off, 'HD is off by default');
  // Settings switch
  await page.evaluate(() => { document.getElementById('st-hd').click(); });
  check(await page.evaluate(() => HD.on && localStorage.getItem('bb-hd-sprites') === '1' && document.getElementById('st-hd').textContent === 'On'), 'Settings switch turns it on and remembers it');
  await page.evaluate(() => { document.getElementById('st-hd').click(); });
  check(await page.evaluate(() => !HD.on && localStorage.getItem('bb-hd-sprites') === '0'), 'and off again');
  // Team Builder preview row uses the HD set when on
  const tb = await page.evaluate(() => { HD.set(true); const set = spriteSetFor('highelf'); const c = paintSprite(set.Lineman, '#1e3a8a', '#fff'); HD.set(false); return c.width; });
  check(tb === 64, 'Team Builder / memorial previews paint the 64x64 grid', tb);
  // crouch (idle breathing) keeps working on a 64 grid
  check(await page.evaluate(() => { const gr = crouchGrid(SPRITES_HD.highelf.Lineman, 1); return gr !== SPRITES_HD.highelf.Lineman && gr.length === 64; }), 'idle crouch frame works on 64x64');
  // paint cost: 64x64 v 32x32
  const perf = await page.evaluate(() => { const t = f => { const a = performance.now(); for (let i = 0; i < 200; i++) f(); return (performance.now() - a) / 200; };
    return { hd: t(() => paintSprite(SPRITES_HD.highelf.Lineman, '#1e3a8a', '#ffffff')).toFixed(3), sd: t(() => paintSprite(SPRITES.highelf.Lineman, '#1e3a8a', '#ffffff')).toFixed(3) }; });
  console.log('      paint one sprite (ms, cached afterwards):', JSON.stringify(perf));
  await ctx.close();
  await shots(browser, 'before', '');
  await shots(browser, 'after', '?hd');
  await done(browser);
})();
