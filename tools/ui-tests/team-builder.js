// Team Builder checks: the tabs (in the sticky summary box), hiring, Star Players on Hire players and the roster, the roster row
// layout, the styled drop-down menus (group headings, reasons), the landscape summary, and no sideways scrolling.
// node tools/ui-tests/team-builder.js [outDir]
const { chromium, OUT, check, done, openGame, setSelect, click, putTeam } = require('./lib');

(async () => {
  const browser = await chromium.launch();
  for (const [label, opts] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['phone', { device: 'Pixel 7' }]]) {
    console.log(`\n== ${label}`);
    const { ctx, page, errors } = await openGame(browser, opts);
    await putTeam(page, { id: 'tb-orcs', race: 'orc', format: 'matched', rules: 'gotg2', stars: ['grakcrumb'], players: [[3], [3], [2], [4], [0], [0], [0], [0], [0]] });
    await putTeam(page, { id: 'tb-seven', race: 'orc', format: 'sevens-mp', budget: 600, rerolls: 1, vet: 0, players: [[0], [0], [0], [3], [2], [1], [0]] });
    await page.evaluate(() => TB.open(() => {}, 'tb-orcs')); await page.waitForTimeout(300);
    const tabs = () => page.evaluate(() => [...document.querySelectorAll('#tb-tabs [data-tbtab]')].filter(b => !b.hidden).map(b => b.dataset.tbtab + (b.getAttribute('aria-selected') === 'true' ? '*' : '')).join(','));
    check(await page.evaluate(() => !!document.querySelector('.tb-sum #tb-tabs')), 'tabs live in the summary box');
    check((await tabs()) === 'team,staff,hire,roster*,extras', 'a saved team opens on Roster; tournament team has Inducements', await tabs());
    check(await page.evaluate(() => document.querySelectorAll('#tb-roster .tb-plstar').length === 2), 'Star Player pair listed on the roster');
    check(await page.evaluate(() => [...document.querySelectorAll('.tb-plstar .tb-no')].map(x => x.textContent).join(',') === '10,11'), 'Stars numbered after the players');
    check(await page.evaluate(() => [...document.querySelectorAll('#tb-roster .tb-ppos')].length >= 9), 'positions shown in bold on each row');
    check(await page.evaluate(() => [...document.querySelectorAll('#tb-roster .pl-stats')].every(x => x.getBoundingClientRect().height < 30)), 'characteristics fit on one line');
    check(await page.evaluate(() => document.querySelectorAll('button.tb-mpsel.fs-btn').length >= 9), 'extra-skill pickers use the styled menu');
    await click(page, '[data-tbtab="hire"]'); await page.waitForTimeout(150);
    check(await page.evaluate(() => getComputedStyle(document.getElementById('tb-hirestars')).display !== 'none'), 'Star Players are hired on Hire players');
    check(await page.evaluate(() => { const c = document.querySelector('#tb-hire'), r = c.getBoundingClientRect(); return [...c.querySelectorAll('.tb-hire')].every(b => b.getBoundingClientRect().right <= r.right + 1); }), 'hire buttons inside the card');
    await click(page, '#tb-hire [data-hire="Lineman"]');
    check((await page.textContent('[data-tbtab="roster"]')).includes('12/16'), 'hiring updates the Roster tab count');
    await page.evaluate(() => { document.getElementById('team-builder').scrollTop = 99999; }); await page.waitForTimeout(100);
    check(await page.evaluate(() => { const r = document.getElementById('tb-tabs').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'tabs still visible after scrolling down');
    await page.screenshot({ path: `${OUT}/tb-${label}-hire.png` });
    // the skill menu: group headings and greyed-out reasons
    await click(page, '[data-tbtab="roster"]'); await page.waitForTimeout(100);
    await page.evaluate(() => document.querySelectorAll('button.tb-mpsel')[3].click()); await page.waitForTimeout(150);
    check(await page.evaluate(() => [...document.querySelectorAll('.fs-menu .fs-grp')].length >= 1), 'skill menu has group headings', await page.evaluate(() => [...document.querySelectorAll('.fs-menu .fs-grp')].map(g => g.textContent)));
    await page.keyboard.press('Escape'); await page.mouse.click(5, 5);
    // a Sevens tournament team: Inducements tab, no Star Players
    await setSelect(page, '#tb-teams', 'tb-seven'); await page.waitForTimeout(200);
    await click(page, '[data-tbtab="hire"]');
    check((await tabs()).includes('extras') && await page.evaluate(() => getComputedStyle(document.getElementById('tb-hirestars')).display === 'none'), 'Sevens tournament: Inducements tab, no Star Players');
    check(await page.evaluate(() => document.getElementById('team-builder').scrollWidth <= document.getElementById('team-builder').clientWidth), 'no sideways scrolling');
    check(!errors.length, 'no page errors', errors);
    await ctx.close();
  }
  // a phone on its side: the summary box packs into a slim row
  console.log('\n== phone landscape');
  const { ctx, page, errors } = await openGame(browser, { device: 'Pixel 7 landscape' });
  await putTeam(page, { id: 'tb-land', race: 'orc', format: 'matched', rules: 'gotg2', players: [[0], [0]] });
  await page.evaluate(() => TB.open(() => {}, 'tb-land')); await page.waitForTimeout(300);
  const h = await page.evaluate(() => [document.querySelector('#team-builder .tb-sum').getBoundingClientRect().height, innerHeight]);
  check(h[0] < h[1] * 0.34, 'summary box under a third of the screen height', `${Math.round(h[0])} of ${h[1]}px`);
  await page.screenshot({ path: `${OUT}/tb-landscape.png` });
  check(!errors.length, 'no page errors', errors);
  await ctx.close();
  await done(browser);
})();
