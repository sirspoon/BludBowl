// Roster PDF checks: makes sheets for a pack team (legal), a GW team breaking its limits, a UKTC team with a stack and a stat-up,
// a Sevens tournament team and a league team with advances and injuries, checks the ruleset check on each, and saves the PDFs to
// outDir to look at (pdftoppm -png file.pdf out turns them into pictures). Needs the internet once (jsPDF from a CDN).
// node tools/ui-tests/roster-pdf.js [outDir]
const { chromium, OUT, check, done, openGame, putTeam } = require('./lib');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const { ctx, page, errors } = await openGame(browser);
  await page.evaluate(() => localStorage.setItem('bb-net-name', 'Test Coach'));
  const P = (skill, kind) => ({ kind: kind || 'P', skill });
  const teams = [
    ['pack-high-elves', { race: 'highelf', format: 'matched', rules: 'gotg2', rerolls: 4, apothecary: true, cheerleaders: 2, fans: 3, players: [[2, P('Dodge')], [2], [3, P('Dauntless')], [3, P('Dauntless')], [0], [0], [0], [0], [0], [0], [0], [1]] }, true],
    ['gw-humans-illegal', { race: 'human', format: 'matched', budget: 1300, stars: ['griff'], players: [[4, P('Block')], [4, P('Block')], [1, P('Block')], [0, P('Block')], [0, P('Block')], [3, P('Guard', 'S')], [0], [0], [0], [0]] }, false],
    ['uktc-ogres', { race: 'ogre', format: 'matched', rules: 'uktc11', players: [[1, P('Guard'), P('Brawler')], [1, { kind: 'C', stat: 'av' }], [1, P('Block')], [1], [1], [0], [0], [0], [0], [0], [0]] }, true],
    ['sevens-orcs', { race: 'orc', format: 'sevens-mp', budget: 600, vet: 0, rerolls: 1, players: [[0, P('Block')], [0], [0], [3, P('Dodge')], [2], [1], [0]] }, true],
  ];
  for (const [id, spec, legal] of teams) {
    await putTeam(page, Object.assign({ id }, spec));
    const r = await page.evaluate(async id => { const t = TB.get(id), c = TB.rulesCheck(t), J = await ROSTER_PDF._lib(); return { ok: c.ok, problems: c.problems, pdf: ROSTER_PDF._draw(J, t).output('datauristring') }; }, id);
    fs.writeFileSync(`${OUT}/${id}.pdf`, Buffer.from(r.pdf.split(',')[1], 'base64'));
    check(r.ok === legal, `${id}: ruleset check says ${legal ? 'LEGAL' : 'NOT LEGAL'}`, r.problems.length ? r.problems : null);
  }
  // a league team with a career
  await page.evaluate(() => { const pos = Object.keys(RACES.orc.positions);
    TB.put({ id: 'league-orcs', name: 'League Orcs', race: 'orc', played: 5, treasury: 40, rerolls: 3, apothecary: true, record: { w: 3, d: 1, l: 1, tdf: 8, tda: 5, casf: 9, casa: 4 },
      players: [0, 0, 0, 0, 0, 3, 3, 4, 4, 2, 1, 5].map((i, j) => ({ pos: pos[i], name: 'Orc ' + (j + 1), spp: j * 3, advs: j === 5 ? [{ skill: 'Mighty Blow', kind: 'P' }, { stat: 'st' }] : [], inj: j === 2 ? { ma: 1 } : undefined, mng: j === 3 })) }); });
  const lg = await page.evaluate(async () => { const J = await ROSTER_PDF._lib(); return ROSTER_PDF._draw(J, TB.get('league-orcs')).output('datauristring'); });
  fs.writeFileSync(`${OUT}/league-orcs.pdf`, Buffer.from(lg.split(',')[1], 'base64'));
  check(fs.statSync(`${OUT}/league-orcs.pdf`).size > 10000, 'league team PDF made');
  // the Teams screen button downloads one
  await page.evaluate(() => { document.querySelector('[data-go="teams"]').click(); }); await page.waitForTimeout(300);
  await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sel]')].find(b => /pack-high-elves/.test(b.textContent)); b.click(); });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.evaluate(() => document.querySelector('[data-act="pdf"]').click())]);
  check(/roster\.pdf$/.test(dl.suggestedFilename()), 'Export PDF on the Teams screen downloads', dl.suggestedFilename());
  console.log(`PDFs in ${OUT}`);
  check(!errors.length, 'no page errors', errors);
  await ctx.close();
  await done(browser);
})();
