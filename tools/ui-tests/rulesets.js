// Rulesets checks: the screen (sections, ruleset dropdown, GW default), copying GW (skill points), deleting and restoring the
// examples, a team built under a pack's rules in the Team Builder, computer teams drafted legally under every ruleset for every
// race, and the tournament form's Rules dropdown. node tools/ui-tests/rulesets.js [outDir]
const { chromium, OUT, check, done, openGame, setSelect, click, putTeam } = require('./lib');

(async () => {
  const browser = await chromium.launch();
  const { ctx, page, errors } = await openGame(browser);
  // the screen
  await page.evaluate(() => TRULES.open(() => {})); await page.waitForTimeout(200);
  check((await page.textContent('#tr-title')) === 'Rulesets', 'screen is called Rulesets');
  check(await page.evaluate(() => [...document.querySelectorAll('[data-trsec]')].map(b => b.dataset.trsec).join(',') === 'tour,sevtour,league,sevleague'), 'four sections');
  check(await page.evaluate(() => document.getElementById('tr-pick').value === 'gw'), 'opens on GW Matched Play');
  check(await page.evaluate(() => TRULES.list().map(r => r.name).join('|') === 'GW Matched Play (BB2025)|Example: Glory on the Gridiron 2|Example: UKTC XI'), 'built-in rulesets', await page.evaluate(() => TRULES.list().map(r => r.name)));
  for (const sec of ['sevtour', 'league', 'sevleague']) { await click(page, `[data-trsec="${sec}"]`); check(await page.evaluate(() => !!document.querySelector('#tr-body .tr-card')), `section ${sec} shows GW's rules`); }
  await click(page, '[data-trsec="tour"]');
  // copy GW: a skill-points ruleset
  await click(page, '[data-trcopy="gw"]'); await page.waitForTimeout(150);
  check(await page.evaluate(() => document.getElementById('tr-skill').value === 'points'), 'GW copy uses skill points');
  await click(page, '[data-trsave]'); await page.waitForTimeout(150);
  const gwCopy = await page.evaluate(() => (TRULES.list().find(r => r.name === 'Copy of GW Matched Play') || {}).id);
  check(!!gwCopy, 'GW copy saved');
  // delete and restore an example
  await setSelect(page, '#tr-pick', 'gotg2'); await click(page, '[data-trdel="gotg2"]'); await click(page, '[data-trdel="gotg2"]');
  check(await page.evaluate(() => !TRULES.get('gotg2') && !!document.querySelector('[data-trrestore]')), 'example deleted (hidden), restore offered');
  await click(page, '[data-trrestore]');
  check(await page.evaluate(() => !!TRULES.get('gotg2')), 'examples restored');
  await click(page, '#tr-back');
  // a team under Glory on the Gridiron: budget by tier, primary limit, barred inducement flagged
  await putTeam(page, { id: 'rs-orcs', race: 'orc', format: 'matched', rules: 'gotg2', rerolls: 3, mind: { kegs: 1, ett: 1 },
    players: [[0], [0], [0], [0], [0], [0], [0], [3, { kind: 'P', skill: 'Block' }], [3], [2, { kind: 'P', skill: 'Sure Hands' }], [2]] });
  const chk = await page.evaluate(() => { const t = TB.get('rs-orcs'); return { budget: t.budget, check: TB.rulesCheck(t) }; });
  check(chk.budget === 1270, 'Tier 2 budget 1,270k');
  check(!chk.check.ok && chk.check.problems.some(p => /Extra Team Training/.test(p)), 'a barred inducement makes the team not legal', chk.check.problems);
  // computer teams drafted to each ruleset are legal, for every race
  const drafts = await page.evaluate(ids => ids.map(id => { let bad = 0, n = 0; for (const race of LEAGUE.raceKeys().filter(rc => TRULES.allows(TRULES.get(id), rc))) for (let i = 0; i < 2; i++) { const t = CUP.draftTeam(race, 1150, 'x', new Set(), new Set(), 'std', id); n++; if (TB.mpProblems(t, TB.costs(t)).length) bad++; } return [id, n, bad]; }), ['gw', 'gotg2', 'uktc11', gwCopy]);
  drafts.forEach(([id, n, bad]) => check(!bad, `${n} computer teams drafted legally under ${id}`, bad ? `${bad} illegal` : null));
  // the tournament form
  await page.evaluate(() => { CUP.open(); document.querySelector('[data-cact="new"]').click(); }); await page.waitForTimeout(200);
  await setSelect(page, '#cp-rules', 'gotg2'); await page.waitForTimeout(100);
  check(await page.evaluate(() => ![...document.querySelectorAll('#cup-hub .lg-lbl')].some(x => /Budget/.test(x.textContent))), 'pack rules: no budget to choose');
  check(await page.evaluate(() => [...document.querySelectorAll('#cup-hub .lg-pick')].some(x => /rs-orcs/.test(x.textContent))), 'teams built under the rules are listed');
  await page.screenshot({ path: `${OUT}/rulesets-cup.png` });
  check(!errors.length, 'no page errors', errors);
  await ctx.close();
  await done(browser);
})();
