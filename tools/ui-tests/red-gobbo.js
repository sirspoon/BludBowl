// Da Red Gobbo's Squigmobile (an Exhibition-only Star): who can hire him, his sprite on the pitch, the extra Bribe each half,
// Hail Mary bombs, and a quick computer match with him hired. node tools/ui-tests/red-gobbo.js [outDir]
const { chromium, OUT, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  let { page, errors } = await openGame(browser);
  // ---- who can hire him
  const who = await page.evaluate(() => ({
    exh: starsFor('human', null, null, true).includes('redgobbo'), def: starsFor('human').includes('redgobbo'),
    dwarf: starsFor('dwarf', null, null, true).includes('redgobbo'), cdwarf: starsFor('chaosdwarf', null, null, true).includes('redgobbo'),
    anyRace: Object.keys(RACES).filter(r => r !== 'dwarf' && !starsFor(r, null, null, true).includes('redgobbo')) }));
  check(who.exh && !who.def, 'offered in Exhibition Play only (starsFor needs the exhibition flag)', who);
  check(!who.dwarf && who.cdwarf, 'never for Dwarfs (Chaos Dwarfs are fine)');
  check(!who.anyRace.length, 'offered to every other team', who.anyRace);
  // ---- the exhibition shop lists him (gold: +300k extra), not for a Dwarf team
  await page.evaluate(() => { localStorage.setItem('bb-ex-ind', '300'); AI.set(0, false); AI.set(1, true); EXIND.start('human', 'orc', false, 'std'); });
  await page.waitForTimeout(500);
  const shop = await page.evaluate(() => { const row = [...document.querySelectorAll('#ex-ind .lg-star-row')].find(r => /Red Gobbo/.test(r.textContent)); if (row) row.scrollIntoView({ block: 'center' }); return { row: !!row, cpu: (EXIND.get().ind[1].stars || []).join(',') }; });
  check(shop.row, 'listed on the exhibition Star Players list');
  await page.waitForTimeout(300); await page.screenshot({ path: OUT + '/gobbo-shop.png' });
  await page.evaluate(() => { document.getElementById('ex-ind').classList.add('hidden'); EXIND.start('dwarf', 'orc', false, 'std'); });
  await page.waitForTimeout(400);
  check(await page.evaluate(() => !/Red Gobbo/.test(document.getElementById('ex-ind').textContent.split('Orc')[0] || '')), "not on a Dwarf team's list");
  await page.evaluate(() => { document.getElementById('ex-ind').classList.add('hidden'); localStorage.setItem('bb-ex-ind', 'std'); });
  // ---- a match with him hired by a person (Humans) against the computer
  await page.evaluate(() => { AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true, ind: [{ stars: ['redgobbo'] }, {}] }); });
  const t0 = Date.now(); let on = false;
  while (Date.now() - t0 < 90000 && !(on = await page.evaluate(() => {
    const go = [...document.querySelectorAll('button')].find(b => b.offsetParent && /^start match$/i.test(b.textContent.trim())); if (go) go.click(); const g = state.players.find(p => p.star === 'redgobbo'); return !!g && g.x >= 0 && !g.isReserve && state.half >= 1 && state.turn[0] + state.turn[1] >= 1; }))) await page.waitForTimeout(500);
  check(on, 'he takes the pitch');
  const b = await page.evaluate(() => ({ g: state.gobboBribe, txt: document.getElementById('bribe-indicator').textContent, card: starRuleState(state.players.find(p => p.star === 'redgobbo')).label }));
  check(b.g && b.g[0] === 1 && b.g[1] === 0, 'his team has the extra Bribe this half', b);
  check(/H:0\+1 O:0/.test(b.txt), 'the Bribe indicator shows it', b.txt);
  // close-up of him on the pitch
  await page.evaluate(() => { AI.set(0, false); AI.set(1, false); const g = state.players.find(p => p.star === 'redgobbo'); state.selectedId = g.id; try { refreshSelection(g); } catch (e) {} render(); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT + '/gobbo-pitch.png' });
  // ---- the Bribe rules: Da Red Gobbo's present goes first; unused, it's gone at half-time (and a new one arrives)
  const br = await page.evaluate(() => new Promise(res => {
    const g = state.players.find(p => p.star === 'redgobbo'), out = {};
    state.gobboBribe = [1, 0]; state.bribes[0] = 1; state.argueBlocked[0] = true; AI.set(0, true);   // (the computer answers "use a Bribe?" with yes)
    const r0 = Math.random; Math.random = () => 0.9;   // the Bribe roll succeeds
    resolveSendOff(g, result => {
      Math.random = r0; out.result = result; out.after = [state.gobboBribe[0], state.bribes[0]]; out.card = starRuleState(g).label;
      state.half = 2; state.gobboBribe = [0, 0]; gobboHalfCheck(); out.h2 = state.gobboBribe.slice();   // a used one: a fresh present next half
      state.half = 3; gobboHalfCheck(); out.h3 = state.gobboBribe.slice();   // unused: replaced (not stacked)
      g.isCasualty = true; state.half = 4; gobboHalfCheck(); out.cas = state.gobboBribe.slice(); g.isCasualty = false;
      out.log = [...document.querySelectorAll('#message-log > *')].slice(-6).map(e => e.textContent.trim()); AI.set(0, false); res(out);
    }, true);
  }));
  check(br.result === 'saved' && br.after[0] === 0 && br.after[1] === 1, "a send-off uses Da Red Gobbo's present before a bought Bribe", br);
  check(/gone/i.test(br.card), 'his card says the Bribe is gone', br.card);
  check(br.h2[0] === 1 && br.h3[0] === 1 && br.cas[0] === 0, 'one present each half, never stacked; none once he is a casualty', br);
  check(br.log.some(l => /never used Da Red Gobbo's present/.test(l)), 'an unused present is lost at the end of the half (logged)');
  console.log('page errors:', errors.length ? errors : 'none');
  check(!errors.length, 'no page errors', errors.slice(0, 3));
  // ---- fast computer matches with him hired by both sides (?simtest): nothing errors or stalls
  const N = +(process.argv.find(a => /^--n=/.test(a)) || '--n=4').slice(4), races = ['human', 'orc', 'skaven', 'chaosdwarf', 'woodelf', 'goblin', 'undead', 'lizardmen'];
  const tally = { bomb: 0, hail: 0, sent: 0, present: 0, gift: 0, jugg: 0, td: 0 };
  for (let m = 0; m < N; m++) {
    const sim = await openGame(browser, { query: '?simtest' }), P = sim.page;
    await P.evaluate(([a, b]) => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.__L = [];
      const L = window.log; window.log = function (msg) { try { window.__L.push(String(msg)); } catch (e) {} return L.apply(this, arguments); };
      window.launchMatch(a, b, { replaceOk: true, ind: [{ stars: ['redgobbo'] }, { stars: ['redgobbo'] }] }); }, [races[(2 * m) % races.length], races[(2 * m + 1) % races.length]]);
    const t1 = Date.now(); let r = null;
    while (Date.now() - t1 < 120000) {
      await P.waitForTimeout(300);
      r = await P.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
        return { over: !!state.isGameOver, score: [state.score[0], state.score[1]], half: state.half, turn: [state.turn[0], state.turn[1]] }; });
      if (r.over) break;
    }
    const L = await P.evaluate(() => window.__L.join('\n'));
    const n = re => (L.match(re) || []).length;
    const row = { bomb: n(/Squigmobile lights a BOMB/g), hail: n(/Squigmobile hurls the bomb high/g), sent: n(/Squigmobile.{0,40}Sent-off|Sent-off.{0,40}Squigmobile/gi), present: n(/HAVE A PRESENT/g), gift: n(/Da Red Gobbo hands the ref/g), jugg: n(/Juggernaut! Da Red Gobbo/g), td: r.score[0] + r.score[1] };
    Object.keys(tally).forEach(k => { tally[k] += row[k]; });
    check(r.over && !sim.errors.length, `computer match ${m + 1} (${races[(2 * m) % races.length]} v ${races[(2 * m + 1) % races.length]}) finished with no errors`, Object.assign({ secs: Math.round((Date.now() - t1) / 1000) }, r.over ? row : r, sim.errors.length ? { err: sim.errors[0] } : {}));
    await sim.ctx.close();
  }
  console.log('totals', JSON.stringify(tally));
  await done(browser);
})();
