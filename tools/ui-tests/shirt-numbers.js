// Shirt numbers: tap a player's number in the Team Builder to choose one (1-99). Checks: setting a number, a duplicate (refused, then
// swapped), a gap, a bad number, reordering (numbers stay with the player), hiring (lowest free), save + reload, export/import, the
// match (players wear their numbers; away team numbered from 1), the roster PDF order, "Number all by order", and a phone (touch).
// node tools/ui-tests/shirt-numbers.js [outDir]
const { chromium, OUT, check, done, openGame, click, putTeam } = require('./lib');

(async () => {
  const browser = await chromium.launch();
  for (const [label, opts] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['phone', { device: 'Pixel 7' }]]) {
    console.log(`\n== ${label}`);
    const { ctx, page, errors } = await openGame(browser, opts);
    const phone = label === 'phone';
    await putTeam(page, { id: 'sn-orcs', race: 'orc', players: [[0], [0], [0], [3], [2], [1], [0], [0], [0], [0], [0]] });
    await page.evaluate(() => TB.open(() => {}, 'sn-orcs')); await page.waitForTimeout(300);
    await click(page, '[data-tbtab="roster"]'); await page.waitForTimeout(100);
    const nums = () => page.evaluate(() => [...document.querySelectorAll('#tb-roster button.tb-no')].map(b => b.textContent + (b.classList.contains('own') ? '*' : '')).join(','));
    const names = () => page.evaluate(() => [...document.querySelectorAll('#tb-roster .tb-pname')].map(b => b.value).join(','));
    const tapNo = async i => { const sel = `#tb-roster [data-nr="${i}"]`; if (phone) await page.tap(sel); else await page.click(sel); await page.waitForTimeout(120); };
    const enter = async (v, btn = '#tbn-set') => { await page.fill('#tb-nrin', String(v)); if (phone) await page.tap(btn); else await page.click(btn); await page.waitForTimeout(120); };
    const dlgOpen = () => page.evaluate(() => !document.getElementById('tb-nrdlg').classList.contains('hidden'));
    const note = () => page.textContent('#tbn-note');
    const rest = ',4,5,6,7,8,9,10,11', restS = ',4*,5*,6*,7*,8*,9*,10*,11*';

    check((await nums()) === '1,2,3' + rest, 'no numbers set: numbered by roster order', await nums());
    await tapNo(2);
    check(await dlgOpen(), 'tapping a number opens the number box');
    if (phone) {
      const r = await page.evaluate(() => { const c = document.querySelector('#tb-nrdlg .tbp-card').getBoundingClientRect(); return [c.left, c.right, innerWidth]; });
      check(r[0] >= 0 && r[1] <= r[2], 'number box fits the phone width', r);
      await page.screenshot({ path: `${OUT}/sn-phone-dialog.png` });
    }
    await enter(23);
    check(!(await dlgOpen()) && (await nums()) === '1*,2*,23*' + restS, 'set 23: the others keep their numbers', await nums());
    // a bad number
    await tapNo(1); await enter(0);
    check(await dlgOpen() && /1 to 99/.test(await note()), 'number 0 refused', await note());
    await enter(100);
    check(await dlgOpen() && /1 to 99/.test(await note()), 'number 100 refused');
    await page.click('#tbn-cancel'); await page.waitForTimeout(80);
    // a duplicate: refused, then swapped
    const before = await names();
    await tapNo(0); await enter(23);
    check(await dlgOpen() && /already/.test(await note()) && await page.isVisible('#tbn-swap'), 'duplicate 23 refused, Swap offered', await note());
    if (phone) await page.tap('#tbn-swap'); else await page.click('#tbn-swap');
    await page.waitForTimeout(120);
    check((await nums()) === '23*,2*,1*' + restS, 'swap: the two exchange numbers', await nums());
    // a gap
    await tapNo(1); await enter(15);
    check((await nums()) === '23*,15*,1*' + restS, 'gaps are fine (15 with no 2)', await nums());
    // reorder: the number goes with the player
    await click(page, '#tb-roster [data-dn="0"]'); await page.waitForTimeout(100);
    const n1 = (await names()).split(','), b1 = before.split(',');
    check((await nums()) === '15*,23*,1*' + restS && n1[0] === b1[1] && n1[1] === b1[0], 'moving a player down keeps the numbers with the players', await nums());
    // hiring: the lowest free number
    await click(page, '[data-tbtab="hire"]'); await click(page, '#tb-hire [data-hire="Lineman"]'); await click(page, '[data-tbtab="roster"]'); await page.waitForTimeout(100);
    check((await nums()).split(',').pop().startsWith('2'), 'a new hire takes the lowest free number (2)', await nums());
    await click(page, '#tb-save'); await page.waitForTimeout(150);
    const saved = await page.evaluate(() => TB.get('sn-orcs').players.map(p => p.nr).join(','));
    check(saved === '15,23,1' + rest + ',2', 'saved numbers', saved);
    // the match: players wear their numbers
    const match = await page.evaluate(() => {
      ROSTERS[0] = TB.toRace('sn-orcs'); buildPlayers();
      const mine = state.players.filter(p => p.team === 0), away = state.players.filter(p => p.team === 1);
      updateUI(mine.find(p => p.nr === 23));
      return { mine: mine.map(p => p.nr).sort((a, b) => a - b).join(','), away: away.map(p => pNo(p)).sort((a, b) => a - b)[0], panel: document.getElementById('stats-panel').textContent.includes('#23'),
        jm: mine.filter(p => p.journeyman).map(p => p.nr).join(',') };
    });
    check(match.mine === '1,2,4,5,6,7,8,9,10,11,15,23', 'match: players wear their own numbers', match);
    check(match.away === 1 && match.panel, 'match: player panel shows #23; away team numbered from 1', match);
    // roster PDF lists by number
    const pdf = await page.evaluate(() => { try { return ROSTER_PDF.sheet ? ROSTER_PDF.sheet(TB.get('sn-orcs')).players.map(p => p.n).join(',') : null; } catch (e) { return 'err ' + e.message; } });
    if (pdf != null) check(pdf === '1,2,4,5,6,7,8,9,10,11,15,23', 'roster PDF sorted by shirt number', pdf);
    // export / import keeps them
    const imp = await page.evaluate(() => { const t = TB.get('sn-orcs'); t.id = 'sn-copy'; const r = TB.importData(JSON.stringify({ teams: [t] })); return TB.get(r.first).players.map(p => p.nr).join(','); });
    check(imp === '15,23,1' + rest + ',2', 'export / import keeps the numbers', imp);
    // Journeymen take numbers nobody on the roster has; a repeated number in a file is fixed; someone joining mid-match gets a free one
    const misc = await page.evaluate(() => {
      const t = TB.get('sn-orcs'); t.players = t.players.slice(0, 10); t.players.forEach((p, i) => { p.nr = i < 9 ? i + 1 : 30; });
      const jm = CAREER.matchSquad(CAREER.normTeam(JSON.parse(JSON.stringify(t)))).filter(x => x.ovr.journeyman).map(x => x.ovr.nr).join(',');
      const d = TB.get('sn-orcs'); d.id = 'sn-dup'; d.players[1].nr = d.players[0].nr; const r = TB.importData(JSON.stringify({ teams: [d] }));
      const dup = TB.get(r.first).players.map(p => p.nr), uniq = new Set(dup).size === dup.length;
      const z = { team: 0, type: 'Zombie' }; state.players.push(z); const zn = pNo(z); state.players.pop();
      return { jm, uniq, dup: dup.join(','), zn };
    });
    check(misc.jm === '10', 'a Journeyman takes a number free on the roster', misc.jm);
    check(misc.uniq, 'an imported team with a repeated number gets it fixed', misc.dup);
    check(misc.zn === 3, 'a player joining mid-match takes the lowest free number', misc.zn);
    // reload: still there
    await page.reload(); await page.waitForTimeout(1300);
    await page.evaluate(() => { const s = document.getElementById('splash'); if (s) s.style.display = 'none'; TB.open(() => {}, 'sn-orcs'); }); await page.waitForTimeout(300);
    await click(page, '[data-tbtab="roster"]'); await page.waitForTimeout(100);
    check((await nums()) === '15*,23*,1*' + restS + ',2*', 'numbers survive a reload', await nums());
    // firing frees the number; "Number all by order" forgets them
    await click(page, '#tb-roster [data-fire="1"]'); await page.waitForTimeout(100);
    check(!(await nums()).includes('23'), 'releasing the player frees his number', await nums());
    await tapNo(0); await click(page, '#tbn-clear'); await page.waitForTimeout(120);
    check((await nums()) === '1,2,3' + rest, '"Number all by order" goes back to 1, 2, 3...', await nums());
    check(await page.evaluate(() => document.getElementById('team-builder').scrollWidth <= document.getElementById('team-builder').clientWidth), 'no sideways scrolling');
    check(!errors.length, 'no page errors', errors);
    await ctx.close();
  }
  await done(browser);
})();
