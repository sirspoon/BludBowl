// Roster PDF checks: makes sheets for big teams (one page, A4 and Letter, type as large as fits), a pack team (legal), a GW team breaking its limits, a UKTC team with a stack and a stat-up,
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
  // big teams still fit the roster on one page, A4 and US Letter, with the type as large as fits (v5.39)
  await page.evaluate(() => {
    const big = ['Human', 'Human', 'Human', 'Human', 'Human', 'Human', 'Human', 'Human', 'Goblin', 'Orc', 'Skaven', 'DarkElf', 'Thrower', 'Troll', 'Ogre', 'Minotaur'];
    const sk = [['Block', 'Dodge', 'Sidestep', 'Fend'], ['Guard', 'Mighty Blow', 'Stand Firm'], ['Tackle', 'Wrestle', 'Strip Ball', 'Diving Tackle'], ['Catch', 'Sure Feet', 'Nerves of Steel', 'Extra Arms'], ['Dirty Player', 'Sneaky Git', 'Shadowing']];
    TB.put({ id: 'big-renegades', name: 'The Thoroughly Unpleasant Rabble', race: 'renegades', played: 14, treasury: 125, rerolls: 4, apothecary: true, coaches: 2, cheerleaders: 2, fans: 4, record: { w: 9, d: 2, l: 3, tdf: 24, tda: 11, casf: 30, casa: 14 },
      players: big.map((pos, j) => ({ pos, name: ['Grimgor Bonecrusher', 'Snikkit the Sly', 'Vorag Ironjaw', 'Belladonna Vex', 'Krug', 'Ulfric Stormhand', 'Thaddeus Blackwood', 'Morg the Mighty', 'Nibbles', 'Gutrot', 'Skitter', 'Lady Sylvaine', 'Hurl McGee', 'Mungo', 'Big Bertha', 'Horned Horror'][j], spp: 6 + j * 7,
        advs: j < 13 ? sk[j % 5].slice(0, 2 + (j % 3)).map(s => ({ skill: s, kind: 'P' })).concat(j % 4 === 0 ? [{ stat: 'ma' }] : []) : [{ skill: 'Block', kind: 'S' }, { skill: 'Grab', kind: 'P' }], inj: j === 6 ? { av: 1 } : undefined, mng: j === 2 })) });
    // the worst case: 16 rows (14 long-named players with extra skills and Dribl & Drull), a tournament team over its limits
    const pos = Object.keys(RACES.renegades.positions), many = ['Block', 'Dodge', 'Guard', 'Mighty Blow', 'Tackle', 'Sure Feet', 'Diving Tackle', 'Stand Firm'];
    TB.put({ id: 'stress-renegades', name: 'Worst Case Wanderers of the Badlands', race: 'renegades', format: 'matched', budget: 1300, stars: ['dribldrull'], rerolls: 3, apothecary: true,
      players: [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((i, j) => ({ pos: pos[i], name: 'Long Named Renegade No. ' + (j + 1), mp: { kind: j % 2 ? 'S' : 'P', skill: many[j % 8] } })) });
  });
  for (const id of ['big-renegades', 'stress-renegades', 'sevens-orcs', 'league-orcs'])
    for (const fmt of ['a4', 'letter']) {
      const r = await page.evaluate(async ([id, fmt]) => { const J = await ROSTER_PDF._lib(), d = ROSTER_PDF._draw(J, TB.get(id), fmt); return Object.assign({ pdf: d.output('datauristring'), w: Math.round(d.internal.pageSize.getWidth()) }, d._fit); }, [id, fmt]);
      fs.writeFileSync(`${OUT}/${id}-${fmt}.pdf`, Buffer.from(r.pdf.split(',')[1], 'base64'));
      check(r.onePage && r.rosterPages === 1 && r.w === (fmt === 'a4' ? 297 : 279), `${id} (${fmt}): roster on one page, at ${r.size}pt`);
      if (id === 'big-renegades') check(r.size >= 9, `${id} (${fmt}): 16 skilled players still get 9pt or more`, r.size);
      if (id === 'sevens-orcs') check(r.size === 11, `${id} (${fmt}): a small team gets the largest type`, r.size);
    }
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
