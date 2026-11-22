// Animated dice (v5.51): block dice with the animation off (shown at once, as before) and on (tumbling, Roll, jump and settle,
// skip by tap, a team re-roll replayed), the result always the game's own state.combat.dice; the Roll Dice window's animated
// die; team-colour dice and the plain ones; dice colours in the Team Builder (pickers, following the team colours, reset);
// the reduced-motion defaults; phone screenshots.
// node tools/ui-tests/dice.js [outDir]
const { chromium, OUT, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  // Playwright's browser says it is automated (navigator.webdriver), which the game treats as a test run (animations default off);
  // these pages pretend to be a person's browser so the defaults can be checked too
  const asPerson = async page => page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); } catch (e) {} });

  // ---- defaults: on for a person, off with reduced motion, off in a test run
  for (const [rm, want] of [['no-preference', true], ['reduce', false]]) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, reducedMotion: rm });
    const page = await ctx.newPage(); await asPerson(page);
    await page.goto('file://' + require('path').resolve(__dirname, '..', '..', 'index.html')); await page.waitForTimeout(900);
    const d = await page.evaluate(() => ({ b: DICEFX.S.block(), o: DICEFX.S.other(), team: DICEFX.S.team(), dur: DICEFX.S.dur() }));
    check(d.b === want && d.o === want && d.team === true && d.dur === 1000, `defaults with prefers-reduced-motion: ${rm}: animations ${want ? 'on' : 'off'}, team colours on, 1.0 s`, d);
    await ctx.close();
  }
  {
    const { page, ctx } = await openGame(browser, { query: '?simtest' });
    const d = await page.evaluate(() => ({ b: DICEFX.S.block(), o: DICEFX.S.other(), live: DICEFX.live() }));
    check(!d.b && !d.o && !d.live, '?simtest / automated runs: animations off and never live', d);
    await ctx.close();
  }

  // ---- a match, both sides then handed to people
  const { page, errors } = await openGame(browser, { device: 'Pixel 7' });
  await page.evaluate(() => { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-dice-dur', '600'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(250);
    const ok = await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
      return state.turn[0] >= 1 && state.turn[1] >= 1 && [MODES.IDLE, MODES.SELECT].includes(state.mode); });
    if (ok) break;
  }
  await page.evaluate(() => {
    AI.set(0, false); AI.set(1, false); CLOCK.set(1);
    window.__scene = () => {
      ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden'));
      state.players.forEach(p => { p.x = -10; p.y = -10; p.isReserve = true; });
      const a = state.players.find(p => p.team === 0 && p.type === 'Lineman' && !p.isCasualty && !p.isKO);
      const d = state.players.find(p => p.team === 1 && p.type === 'Lineman' && !p.isCasualty && !p.isKO);
      const h = state.players.find(p => p.team === 0 && p.type === 'Lineman' && p !== a && !p.isCasualty && !p.isKO);
      const fresh = (p, x, y) => Object.assign(p, { x, y, isReserve: false, isDown: false, isStunned: false, isDistracted: false, hasActed: false, hasBlocked: false, actionTaken: 'block', usedSkills: [] });
      fresh(a, 10, 7); fresh(d, 11, 7); fresh(h, 12, 8);   // (a helper: 2 dice)
      Object.assign(state.ball, { carrierId: null, x: 25, y: 14 });
      Object.assign(state, { activeTeam: 0, mode: MODES.IDLE, teamRRUsedThisTurn: false }); state.rr[0] = 0; state.combat = null;
      return [a.id, d.id];
    };
  });
  await page.waitForTimeout(300);
  const flat = () => page.evaluate(() => [...document.querySelectorAll('#dice-container button.die-canvas-btn')].map(b => +b.dataset.face));
  const st = () => page.evaluate(() => ({ dice: state.combat && state.combat.dice ? state.combat.dice.slice() : null, flat: [...document.querySelectorAll('#dice-container button.die-canvas-btn')].map(b => +b.dataset.face),
    cubes: document.querySelectorAll('#dice-container .dfx-slot').length, roll: !!document.getElementById('btn-dice-roll'), open: !document.getElementById('modal-dice').classList.contains('hidden'),
    busy: document.getElementById('dice-modal-card').classList.contains('dfx-busy') }));

  // ---- animation off: rolled as the window opens, face on, no Roll button
  let s = await page.evaluate(() => { localStorage.setItem('bb-dice-anim-block', '0'); const [a, d] = __scene(); startBlock(a, d); return null; });
  s = await st();
  check(s.open && s.dice && s.dice.length === 2 && JSON.stringify(s.flat) === JSON.stringify(s.dice) && !s.roll && !s.cubes, 'animation off: the 2 dice are there at once, face on, no Roll button, matching state.combat.dice', s);

  // ---- animation on: tumbling dice and a Roll button; no roll made yet
  await page.evaluate(() => { localStorage.setItem('bb-dice-anim-block', '1'); localStorage.setItem('bb-dice-anim-other', '1'); const [a, d] = __scene(); startBlock(a, d); });
  await page.waitForTimeout(350);
  s = await st();
  check(s.open && !s.dice && s.cubes === 2 && s.roll && !s.flat.length && s.busy, 'animation on: 2 tumbling dice and a Roll button, nothing rolled yet', s);
  const ang1 = await page.evaluate(() => document.querySelector('#dice-container .dfx-cube').style.transform);
  await page.waitForTimeout(150);
  const ang2 = await page.evaluate(() => document.querySelector('#dice-container .dfx-cube').style.transform);
  check(ang1 !== ang2, 'the waiting dice spin');
  await page.screenshot({ path: OUT + '/dice-waiting-phone.png' });
  await page.evaluate(() => document.getElementById('btn-dice-roll').click());
  await page.waitForTimeout(200);
  s = await st();
  check(s.dice && s.dice.length === 2 && !s.flat.length && s.cubes === 2 && !s.roll && s.busy, 'Roll: the result is rolled at once (state.combat.dice), the dice still in the air', s);
  await page.screenshot({ path: OUT + '/dice-rolling-phone.png' });
  await page.waitForTimeout(800);
  s = await st();
  check(JSON.stringify(s.flat) === JSON.stringify(s.dice) && !s.cubes && !s.busy, 'after the roll length: the usual pickable dice, showing what was rolled', s);
  await page.screenshot({ path: OUT + '/dice-settled-phone.png' });

  // ---- a team re-roll replays the jump, then pickable again
  await page.evaluate(() => { const [a, d] = __scene(); state.rr[0] = 1; startBlock(a, d); document.getElementById('btn-dice-roll').click(); });
  await page.waitForTimeout(900);
  const trrShown = await page.evaluate(() => !document.getElementById('btn-combat-trr').classList.contains('hidden'));
  await page.evaluate(() => document.getElementById('btn-combat-trr').click());
  await page.waitForTimeout(150);
  s = await st();
  check(trrShown && s.cubes === 2 && s.busy && !s.flat.length, 'team re-roll: the dice jump again (no picking meanwhile)', s);
  await page.waitForTimeout(900);
  s = await st();
  check(JSON.stringify(s.flat) === JSON.stringify(s.dice) && !s.busy, 'after the re-roll: pickable dice showing the new state.combat.dice', s);

  // ---- tapping during the roll skips to the end
  await page.evaluate(() => { localStorage.setItem('bb-dice-dur', '2000'); const [a, d] = __scene(); startBlock(a, d); document.getElementById('btn-dice-roll').click(); });
  await page.waitForTimeout(120);
  await page.tap('#dice-container .dfx-tray');
  await page.waitForTimeout(120);
  s = await st();
  check(JSON.stringify(s.flat) === JSON.stringify(s.dice) && s.flat.length === 2, 'a tap during a 2 s roll skips straight to the pickable dice', s);
  // and picking one carries on as usual
  await page.evaluate(() => document.querySelector('#dice-container button.die-canvas-btn').click());
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({ open: !document.getElementById('modal-dice').classList.contains('hidden') }));
  check(!after.open, 'picking a die resolves the block as before', after);
  await page.evaluate(() => { ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden')); localStorage.setItem('bb-dice-dur', '600'); });

  // ---- tapping the waiting dice rolls them (by touch)
  await page.evaluate(() => { const [a, d] = __scene(); startBlock(a, d); });
  await page.waitForTimeout(200);
  await page.tap('#dice-container .dfx-tray');
  await page.waitForTimeout(100);
  s = await st();
  check(s.dice && !s.roll, 'tapping the tumbling dice rolls them', s);
  await page.waitForTimeout(900);

  // ---- team colours on the dice
  const cols = await page.evaluate(() => {
    ROSTERS[0].dice = ['#1d4ed8', '#f8fafc'];
    localStorage.setItem('bb-dice-anim-block', '0');
    const [a, d] = __scene(); startBlock(a, d);
    const bg = getComputedStyle(document.querySelector('#dice-container button.die-canvas-btn')).backgroundColor;
    localStorage.setItem('bb-dice-team', '0');
    const [a2, d2] = __scene(); startBlock(a2, d2);
    const plain = document.querySelector('#dice-container button.die-canvas-btn').style.background;
    localStorage.removeItem('bb-dice-team');
    return { bg, plain, col: DICEFX.colFor(0), alike: DICEFX.ink('#b91c1c', '#c2410c'), c: DICEFX.contrast('#b91c1c', DICEFX.ink('#b91c1c', '#c2410c').pip) };
  });
  check(cols.bg === 'rgb(29, 78, 216)' && cols.col.body === '#1d4ed8' && cols.col.pip === '#f8fafc', "team colours: the rolling team's dice in its colours", cols);
  check(cols.plain === '', 'Dice in team colours off: the plain dice', cols.plain);
  check(cols.alike.changed !== 0 && cols.c >= 3, 'two colours too alike: the pip colour is shifted until it reads (3:1)', cols);
  await page.screenshot({ path: OUT + '/dice-team-colours-phone.png' });

  // ---- the Roll Dice window: the die settles in the window, then the game carries on
  const rr = await page.evaluate(() => {
    const [a] = __scene(); const p = getPlayerById(a); state.selectedId = p.id; window.__res = null;
    setupRoll('DODGE', p, 3, 'None', r => { window.__res = ['pass', r]; }, r => { window.__res = ['fail', r]; }, { desc: 'test dodge', prevMode: MODES.IDLE });
    document.getElementById('btn-roll-confirm').click();
    return { open: !document.getElementById('modal-roll').classList.contains('hidden'), box: !document.getElementById('roll-dfx').classList.contains('hidden'), res: window.__res };
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: OUT + '/dice-roll-window-phone.png' });
  check(rr.open && rr.box && rr.res === null, 'Roll Dice (animated): the window stays open with the die rolling, the game waits', rr);
  await page.waitForTimeout(1600);
  const rr2 = await page.evaluate(() => ({ open: !document.getElementById('modal-roll').classList.contains('hidden'), res: window.__res, trr: !document.getElementById('modal-team-reroll').classList.contains('hidden') }));
  check(!rr2.open && rr2.res && rr2.res[1] >= 1, 'then the window closes and the roll is carried out', rr2);
  const rr3 = await page.evaluate(() => {
    localStorage.setItem('bb-dice-anim-other', '0');
    const [a] = __scene(); const p = getPlayerById(a); state.selectedId = p.id; window.__res = null;
    setupRoll('DODGE', p, 3, 'None', r => { window.__res = ['pass', r]; }, r => { window.__res = ['fail', r]; }, { desc: 'test dodge', prevMode: MODES.IDLE });
    document.getElementById('btn-roll-confirm').click();
    return { open: !document.getElementById('modal-roll').classList.contains('hidden'), res: window.__res };
  });
  check(!rr3.open && rr3.res, 'Animate other rolls off: carried out at once, as before', rr3);

  // ---- the computer's block stays instant even with the animation on
  const ai = await page.evaluate(() => {
    localStorage.setItem('bb-dice-anim-block', '1'); AI.set(0, true);
    const [a, d] = __scene(); state.mode = MODES.LOCKED; startBlock(a, d);
    const r = { dice: state.combat.dice && state.combat.dice.length, roll: !!document.getElementById('btn-dice-roll'), cubes: document.querySelectorAll('#dice-container .dfx-slot').length };
    AI.set(0, false); return r;
  });
  check(ai.dice === 2 && !ai.roll && !ai.cubes, "the computer's own block: rolled and shown at once", ai);
  await page.evaluate(() => ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden')));
  check(!errors.length, 'no page errors in the match', errors.slice(0, 3));

  // ---- Team Builder: the dice colours
  const tb = await openGame(browser, { device: 'Pixel 7' });
  const P = tb.page;
  await P.evaluate(() => { const pos = Object.keys(RACES.human.positions), lm = pos.find(k => /line/i.test(k)) || pos[0];
    TB.put({ id: 'dicet', name: 'Dice Test', race: 'human', primary: '#1d4ed8', secondary: '#f8fafc', rerolls: 2, players: Array.from({ length: 11 }, (_, i) => ({ pos: lm, name: 'P' + i })) }); TB.open('dicet'); });
  await P.waitForTimeout(500);
  await P.evaluate(() => document.querySelector('[data-tbtab="team"]').click()); await P.waitForTimeout(200);
  const sw = () => P.evaluate(() => ({ d0: getComputedStyle(document.getElementById('tb-dice0')).backgroundColor, d1: getComputedStyle(document.getElementById('tb-dice1')).backgroundColor,
    reset: document.getElementById('tb-dicereset').disabled, note: document.getElementById('tb-dicenote').textContent, dice: (TB.get('dicet') || {}).dice }));
  let t = await sw();
  check(t.d0 === 'rgb(29, 78, 216)' && t.d1 === 'rgb(248, 250, 252)' && t.reset === true, 'Team Builder: dice colours start as the team colours, "Use team colours" disabled', t);
  const setPick = async (id, hex) => { await P.tap('#' + id); await P.fill('#tbp-hexin', hex); await P.tap('#tbp-set'); await P.waitForTimeout(150); };
  await setPick('tb-dice0', '#b91c1c');
  await setPick('tb-dice1', '#c2410c');
  t = await sw();
  check(t.d0 === 'rgb(185, 28, 28)' && t.reset === false && /too alike/.test(t.note), 'dice colours set with the picker; too-alike colours get a note; reset enabled', t);
  await P.screenshot({ path: OUT + '/dice-team-builder-phone.png' });
  await setPick('tb-col1', '#166534');
  t = await sw();
  check(t.d0 === 'rgb(185, 28, 28)', 'changing the team colours leaves custom dice alone', t);
  await P.tap('#tb-dicereset'); await P.waitForTimeout(150);
  t = await sw();
  check(t.d0 === 'rgb(22, 101, 52)' && t.reset === true, '"Use team colours" puts the dice back on the team colours', t);
  await setPick('tb-col2', '#fde68a');
  t = await sw();
  check(t.d1 === 'rgb(253, 230, 138)', 'dice on the default follow a change of team colours', t);
  await setPick('tb-dice0', '#7c3aed');
  await P.tap('#tb-save'); await P.waitForTimeout(200);
  const saved = await P.evaluate(() => { const t = TB.get('dicet'); return { dice: t.dice, race: TB.toRace('dicet').dice, exp: JSON.parse(JSON.stringify(t)).dice }; });
  check(saved.dice && saved.dice[0] === '#7c3aed' && saved.race[0] === '#7c3aed', 'saved with the team (t.dice) and into the match team (TB.toRace)', saved);
  check(!tb.errors.length, 'no page errors in the Team Builder', tb.errors.slice(0, 3));

  // ---- landscape phone: the block window with the waiting dice
  const ls = await openGame(browser, { viewport: { width: 860, height: 400 } });
  await ls.page.evaluate(() => { localStorage.setItem('bb-dice-anim-block', '1'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
  for (let i = 0; i < 400; i++) {
    await ls.page.waitForTimeout(250);
    const ok = await ls.page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
      return state.turn[0] >= 1 && state.turn[1] >= 1 && [MODES.IDLE, MODES.SELECT].includes(state.mode); });
    if (ok) break;
  }
  const lsr = await ls.page.evaluate(() => {
    AI.set(0, false); AI.set(1, false); CLOCK.set(1);
    ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden'));
    const a = state.players.find(p => p.team === 0 && !p.isReserve && !p.isCasualty && !p.isKO), d = state.players.find(p => p.team === 1 && !p.isReserve && !p.isCasualty && !p.isKO);
    state.players.forEach(p => { if (p !== a && p !== d) { p.x = -10; p.y = -10; p.isReserve = true; } });
    Object.assign(a, { x: 10, y: 7, isDown: false, actionTaken: 'block', hasBlocked: false }); Object.assign(d, { x: 11, y: 7, isDown: false });
    state.activeTeam = 0; state.combat = null; startBlock(a.id, d.id);
    const r = document.getElementById('btn-dice-roll').getBoundingClientRect(), c = document.getElementById('dice-modal-card').getBoundingClientRect();
    return { rollIn: r.bottom <= innerHeight && r.top >= 0, card: c.height <= innerHeight };
  });
  await ls.page.waitForTimeout(300);
  await ls.page.screenshot({ path: OUT + '/dice-waiting-landscape.png' });
  check(lsr.rollIn && lsr.card, 'landscape phone: the block window and its Roll button fit the screen', lsr);
  check(!ls.errors.length, 'no page errors (landscape)', ls.errors.slice(0, 3));
  await done(browser);
})();
