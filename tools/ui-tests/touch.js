// Touch-screen checks on a phone: skill tags open on a tap (a swipe that starts on one scrolls), a tap elsewhere closes the
// description without blocking the next swipe or pressing what's underneath, the highlight clears, and the tier boxes on the
// Rulesets editor can be dragged by their handle. node tools/ui-tests/touch.js [outDir]
const { chromium, check, done, openGame, putTeam } = require('./lib');

(async () => {
  const browser = await chromium.launch();
  const { ctx, page, errors } = await openGame(browser, { device: 'Pixel 7' });
  await putTeam(page, { id: 'touch-orcs', race: 'orc', players: [[3], [3], [2], [4], [4], [1], [0], [0], [0], [0], [0], [0]] });
  await page.evaluate(() => TB.open(() => {}, 'touch-orcs')); await page.waitForTimeout(400);
  const cdp = await ctx.newCDPSession(page);
  const scroll = () => page.evaluate(() => document.getElementById('team-builder').scrollTop);
  const tipOn = () => page.evaluate(() => !!document.getElementById('skill-tip'));
  const swipe = async (x, y, dy) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dy * i / 10 }] }); await page.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(350); };
  const tagAt = n => page.evaluate(n => { const t = document.querySelectorAll('#tb-roster .skill-tag')[n]; t.id = 'probe' + n; t.scrollIntoView({ block: 'center' }); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, n);
  let t = await tagAt(2); await page.waitForTimeout(200);
  let s0 = await scroll(); await swipe(t.x, t.y, -200);
  check(!(await tipOn()) && (await scroll()) - s0 > 100, 'a swipe starting on a skill tag scrolls and does not open it');
  t = await tagAt(4); await page.waitForTimeout(200);
  const bg = () => page.evaluate(() => getComputedStyle(document.getElementById('probe4')).backgroundColor), base = await bg();
  await page.touchscreen.tap(t.x, t.y); await page.waitForTimeout(150);
  check(await tipOn(), 'a tap opens the description');
  await page.touchscreen.tap(30, 760); await page.waitForTimeout(150);
  check(!(await tipOn()) && (await bg()) === base, 'a tap elsewhere closes it and the highlight clears');
  s0 = await scroll(); await swipe(200, 650, -200);
  check((await scroll()) - s0 > 100, 'a swipe straight after closing scrolls');
  t = await tagAt(1); await page.waitForTimeout(200); await page.touchscreen.tap(t.x, t.y); await page.waitForTimeout(150);
  const before = await page.evaluate(() => document.querySelectorAll('#tb-roster .tb-pl').length);
  const x = await page.evaluate(() => { const b = document.querySelectorAll('#tb-roster .tb-x')[3]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.touchscreen.tap(x.x, x.y); await page.waitForTimeout(200);
  check(before === await page.evaluate(() => document.querySelectorAll('#tb-roster .tb-pl').length), 'the closing tap does not press the button underneath');
  // Rulesets editor: drag a team between tier boxes by its handle
  await page.evaluate(() => { document.getElementById('tb-close').click(); TRULES.open(() => {}, 'gotg2'); document.querySelector('[data-trcopy="gotg2"]').click(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-trchip="nurgle"]').scrollIntoView({ block: 'center' }));
  const g = await page.locator('[data-trchip="nurgle"] .tr-grip').boundingBox(), t4 = await page.locator('[data-trbox="4"] .tr-chips').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x + 5, y: g.y + 5 }] });
  for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: g.x + 5 + (t4.x + 40 - g.x) * i / 12, y: g.y + 5 + (t4.y + 15 - g.y) * i / 12 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(150);
  check(await page.evaluate(() => document.querySelector('[data-trchip="nurgle"]').closest('[data-trbox]').dataset.trbox === '4'), 'a team dragged by its handle moves tier');
  check(!errors.length, 'no page errors', errors);
  await ctx.close();
  await done(browser);
})();
