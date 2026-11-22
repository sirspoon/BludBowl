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
    cubes: document.querySelectorAll('#dice-container .dfx-slot').length, roll: document.getElementById('dice-tap-hint').classList.contains('dfx-tap'), open: !document.getElementById('modal-dice').classList.contains('hidden'),
    busy: document.getElementById('dice-modal-card').classList.contains('dfx-busy') }));

  // ---- animation off: rolled as the window opens, face on, no Roll button
  let s = await page.evaluate(() => { localStorage.setItem('bb-dice-anim-block', '0'); const [a, d] = __scene(); startBlock(a, d); return null; });
  s = await st();
  check(s.open && s.dice && s.dice.length === 2 && JSON.stringify(s.flat) === JSON.stringify(s.dice) && !s.roll && !s.cubes, 'animation off: the 2 dice are there at once, face on, no Roll button, matching state.combat.dice', s);

  // ---- animation on: tumbling dice and a Roll button; no roll made yet
  await page.evaluate(() => { localStorage.setItem('bb-dice-anim-block', '1'); localStorage.setItem('bb-dice-anim-other', '1'); const [a, d] = __scene(); startBlock(a, d); });
  await page.waitForTimeout(350);
  s = await st();
  check(s.open && !s.dice && s.cubes === 2 && s.roll && !s.flat.length && s.busy, 'animation on: 2 tumbling dice with "Tap the dice to roll" (no Roll button), nothing rolled yet', s);
  const ang1 = await page.evaluate(() => document.querySelector('#dice-container .dfx-cube').style.transform);
  await page.waitForTimeout(150);
  const ang2 = await page.evaluate(() => document.querySelector('#dice-container .dfx-cube').style.transform);
  check(ang1 !== ang2, 'the waiting dice spin');
  await page.screenshot({ path: OUT + '/dice-waiting-phone.png' });
  await page.evaluate(() => document.querySelector('#dice-container .dfx-tray').click());
  await page.waitForTimeout(200);
  s = await st();
  check(s.dice && s.dice.length === 2 && !s.flat.length && s.cubes === 2 && !s.roll && s.busy, 'Roll: the result is rolled at once (state.combat.dice), the dice still in the air', s);
  await page.screenshot({ path: OUT + '/dice-rolling-phone.png' });
  await page.waitForTimeout(800);
  s = await st();
  check(JSON.stringify(s.flat) === JSON.stringify(s.dice) && !s.cubes && !s.busy, 'after the roll length: the usual pickable dice, showing what was rolled', s);
  await page.screenshot({ path: OUT + '/dice-settled-phone.png' });

  // ---- a team re-roll replays the jump, then pickable again
  await page.evaluate(() => { const [a, d] = __scene(); state.rr[0] = 1; startBlock(a, d); document.querySelector('#dice-container .dfx-tray').click(); });
  await page.waitForTimeout(900);
  const trrShown = await page.evaluate(() => !document.getElementById('btn-combat-trr').classList.contains('hidden'));
  await page.evaluate(() => document.getElementById('btn-combat-trr').click());
  await page.waitForTimeout(150);
  s = await st();
  check(trrShown && s.cubes === 2 && s.busy && !s.flat.length, 'team re-roll: the dice jump again (no picking meanwhile)', s);
  await page.waitForTimeout(900);
  s = await st();
  check(JSON.stringify(s.flat) === JSON.stringify(s.dice) && !s.busy, 'after the re-roll: pickable dice showing the new state.combat.dice', s);

  // ---- the block window keeps its size: waiting, rolling, the dice to pick (re-roll button room kept)
  const H = () => page.evaluate(() => Math.round(document.getElementById('dice-modal-card').getBoundingClientRect().height));
  await page.evaluate(() => { localStorage.setItem('bb-dice-dur', '600'); const [a, d] = __scene(); state.rr[0] = 1; startBlock(a, d); });
  await page.waitForTimeout(200); const h1 = await H();
  await page.evaluate(() => document.querySelector('#dice-container .dfx-tray').click()); await page.waitForTimeout(250); const h2 = await H();
  await page.waitForTimeout(800); const h3 = await H();
  check(h1 === h2 && h2 === h3, 'the block window stays the same size waiting, rolling and with the dice to pick', [h1, h2, h3]);
  // ---- no sideways shift when the landed dice turn into the dice to pick: same centres and size
  const pos = await page.evaluate(async () => {
    const [a, d] = __scene(); startBlock(a, d); document.querySelector('#dice-container .dfx-tray').click();
    await new Promise(r => setTimeout(r, 560));
    const cubes = [...document.querySelectorAll('#dice-container .dfx-slot')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), Math.round(r.width)]; });
    await new Promise(r => setTimeout(r, 500));
    const flat = [...document.querySelectorAll('#dice-container button.die-canvas-btn')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), Math.round(r.width)]; });
    return { cubes, flat };
  });
  check(pos.cubes.length === 2 && pos.flat.length === 2 && pos.cubes.every((c, i) => Math.abs(c[0] - pos.flat[i][0]) <= 1 && Math.abs(c[1] - pos.flat[i][1]) <= 1 && Math.abs(c[2] - pos.flat[i][2]) <= 1),
    'the landed dice sit exactly where (and as big as) the dice to pick appear: no shift', pos);
  // ---- tapping during the roll skips to the end
  await page.evaluate(() => { localStorage.setItem('bb-dice-dur', '2000'); const [a, d] = __scene(); startBlock(a, d); document.querySelector('#dice-container .dfx-tray').click(); });
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
    const plain = document.querySelector('#dice-container button.die-canvas-btn').style.backgroundColor + document.querySelector('#dice-container button.die-canvas-btn').style.backgroundImage;
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
    const waiting = { box: !document.getElementById('roll-dfx').classList.contains('hidden'), cubes: document.querySelectorAll('#roll-dfx .dfx-slot').length, res: window.__res,
      noButton: document.getElementById('btn-roll-confirm').classList.contains('hidden'), hint: document.querySelector('#roll-dfx .dfx-lab').textContent };
    const hh = () => Math.round(document.querySelector('#modal-roll > div').getBoundingClientRect().height);
    const h0 = hh();
    document.querySelector('#roll-dfx .dfx-tray').click();
    const h1 = hh();
    return { waiting, h0, h1, open: !document.getElementById('modal-roll').classList.contains('hidden'), box: !document.getElementById('roll-dfx').classList.contains('hidden'), res: window.__res };
  });
  check(rr.waiting.box && rr.waiting.cubes === 1 && rr.waiting.res === null && rr.waiting.noButton && /Tap the die/.test(rr.waiting.hint), 'roll window (animated): the die tumbles with "Tap the die to roll" and no Roll Dice button; tapping it rolls', rr.waiting);
  await page.waitForTimeout(250);
  await page.screenshot({ path: OUT + '/dice-roll-window-phone.png' });
  check(rr.open && rr.box && rr.res === null, 'Roll Dice (animated): the window stays open with the die rolling, the game waits', rr);
  await page.waitForTimeout(1300);
  const rrShow = await page.evaluate(() => ({ open: !document.getElementById('modal-roll').classList.contains('hidden'), lab: (document.querySelector('#roll-dfx .dfx-lab') || {}).textContent, res: window.__res }));
  check(rrShow.open && /Rolled \d/.test(rrShow.lab || '') && rrShow.res === null, 'the result stays up in the window after landing', rrShow);
  const rH = await page.evaluate(() => Math.round(document.querySelector('#modal-roll > div').getBoundingClientRect().height));
  check(rH === rr.h0 && rr.h0 === rr.h1, 'the roll window stays the same size waiting, rolling and showing the result', [rr.h0, rr.h1, rH]);
  await page.tap('#roll-title');
  await page.waitForTimeout(120);
  const rr2 = await page.evaluate(() => ({ open: !document.getElementById('modal-roll').classList.contains('hidden'), res: window.__res, trr: !document.getElementById('modal-team-reroll').classList.contains('hidden') }));
  check(!rr2.open && rr2.res && rr2.res[1] >= 1, 'a tap puts it away at once and the roll is carried out', rr2);
  // left alone, it goes by itself after a while
  await page.waitForTimeout(500);
  await page.evaluate(() => { const [a] = __scene(); const p = getPlayerById(a); state.selectedId = p.id; window.__res = null;
    setupRoll('DODGE', p, 3, 'None', r => { window.__res = ['pass', r]; }, r => { window.__res = ['fail', r]; }, { desc: 'test dodge', prevMode: MODES.IDLE }); document.getElementById('btn-roll-confirm').click(); });
  await page.waitForTimeout(3600);
  const rr2b = await page.evaluate(() => ({ open: !document.getElementById('modal-roll').classList.contains('hidden'), res: window.__res }));
  check(!rr2b.open && rr2b.res, 'left alone, the result goes by itself (about 2 s after landing)', rr2b);
  const rr3 = await page.evaluate(() => {
    localStorage.setItem('bb-dice-anim-other', '0');
    const [a] = __scene(); const p = getPlayerById(a); state.selectedId = p.id; window.__res = null;
    setupRoll('DODGE', p, 3, 'None', r => { window.__res = ['pass', r]; }, r => { window.__res = ['fail', r]; }, { desc: 'test dodge', prevMode: MODES.IDLE });
    const boxOff = !document.getElementById('roll-dfx').classList.contains('hidden') || document.getElementById('btn-roll-confirm').classList.contains('hidden');
    document.getElementById('btn-roll-confirm').click();
    return { boxOff, open: !document.getElementById('modal-roll').classList.contains('hidden'), res: window.__res };
  });
  check(!rr3.boxOff && !rr3.open && rr3.res, 'Animate other rolls off: carried out at once, as before', rr3);

  // ---- the re-roll window: the failed die lies there from the start, then jumps; the window keeps its size
  const tr = await page.evaluate(async () => {
    localStorage.setItem('bb-dice-anim-other', '1');
    const [a] = __scene(); const p = getPlayerById(a); state.selectedId = p.id; state.rr[0] = 1; state.teamRRUsedThisTurn = false; window.__res = null;
    const R0 = Math.random, q = []; Math.random = () => q.length ? (q.shift() - 1) / 6 + 0.01 : R0();   // (loaded just before each roll: the dice's spins use Math.random too)
    setupRoll('DODGE', p, 3, 'None', r => { window.__res = ['pass', r]; }, r => { window.__res = ['fail', r]; }, { desc: 'test dodge', prevMode: MODES.IDLE });
    q.push(1); document.querySelector('#roll-dfx .dfx-tray').click();
    const w = ms => new Promise(r => setTimeout(r, ms));
    await w(1200); document.getElementById('roll-title').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await w(500);   // (past the swallowed click of that tap)
    const hh = () => Math.round(document.querySelector('#modal-team-reroll > div').getBoundingClientRect().height);
    const open = !document.getElementById('modal-team-reroll').classList.contains('hidden'), dice = document.querySelectorAll('#trr-dfx .dfx-slot').length, h0 = hh();
    q.push(6); document.getElementById('btn-trr-yes').click(); await w(300); const h1 = hh(); await w(900); const h2 = hh();
    Math.random = R0; document.getElementById('roll-title').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await w(300);
    return { open, dice, h: [h0, h1, h2], res: window.__res };
  });
  check(tr.open && tr.dice === 1 && tr.h[0] === tr.h[1] && tr.h[1] === tr.h[2], 'the re-roll window shows the failed die from the start and keeps its size through the re-roll', tr);
  check(tr.res && tr.res[0] === 'pass' && tr.res[1] === 6, 'the re-roll (a 6) is carried out', tr.res);
  // ---- the computer's block (animation on): rolled at once, no Roll button, the dice land the same way, then its pick
  const ai = await page.evaluate(() => {
    localStorage.setItem('bb-dice-anim-block', '1'); AI.set(0, true);
    const [a, d] = __scene(); state.mode = MODES.LOCKED; startBlock(a, d);
    return { dice: state.combat.dice && state.combat.dice.length, roll: document.getElementById('dice-tap-hint').classList.contains('dfx-tap'), cubes: document.querySelectorAll('#dice-container .dfx-slot').length, anim: !!state.combat.diceAnim };
  });
  check(ai.dice === 2 && !ai.roll && ai.cubes === 2 && ai.anim, "the computer's block: rolled at once (no Roll button), the dice in the air", ai);
  await page.waitForTimeout(900);
  const ai2 = await page.evaluate(() => { const r = { dice: state.combat.dice.slice(), flat: [...document.querySelectorAll('#dice-container button.die-canvas-btn')].map(b => +b.dataset.face), anim: !!state.combat.diceAnim }; AI.set(0, false); return r; });
  check(JSON.stringify(ai2.dice) === JSON.stringify(ai2.flat) && !ai2.anim, "then they land on what it rolled, ready for its pick", ai2);
  const ai3 = await page.evaluate(() => {
    localStorage.setItem('bb-dice-anim-block', '0'); AI.set(0, true);
    const [a, d] = __scene(); state.mode = MODES.LOCKED; startBlock(a, d);
    const r = { dice: state.combat.dice && state.combat.dice.length, cubes: document.querySelectorAll('#dice-container .dfx-slot').length, flat: document.querySelectorAll('#dice-container button.die-canvas-btn').length };
    AI.set(0, false); return r;
  });
  check(ai3.dice === 2 && !ai3.cubes && ai3.flat === 2, "animation off: the computer's block shown at once, as before", ai3);
  await page.evaluate(() => ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden')));
  check(!errors.length, 'no page errors in the match', errors.slice(0, 3));

  // ---- the in-match Settings sheet (⚙ in the top bar)
  await page.evaluate(() => ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll'].forEach(id => document.getElementById(id).classList.add('hidden')));
  await page.tap('#btn-gsettings'); await page.waitForTimeout(200);
  const gs = await page.evaluate(() => ({ open: GAME_SETTINGS.isOpen(), rows: document.querySelectorAll('#gs-rows .st-row').length, dice: document.getElementById('st-dice-block').textContent,
    fits: document.querySelector('#game-settings .gs-card').getBoundingClientRect().bottom <= innerHeight + 1 }));
  await page.screenshot({ path: OUT + '/dice-game-settings-phone.png' });
  await page.tap('#st-dice-block'); await page.waitForTimeout(100);
  const gs2 = await page.evaluate(() => ({ dice: document.getElementById('st-dice-block').textContent, stored: localStorage.getItem('bb-dice-anim-block') }));
  const snd = await page.evaluate(() => { const m0 = SFX.isMuted(), mu0 = MUSIC.isEnabled(), t0 = document.getElementById('st-sound').textContent;
    document.getElementById('st-sound').click(); document.getElementById('st-music').click();
    const r = { muted: SFX.isMuted() !== m0, music: MUSIC.isEnabled() !== mu0, label: document.getElementById('st-sound').textContent !== t0,
      barHidden: ['btn-sound', 'btn-music', 'btn-uiscale'].every(id => !document.getElementById(id).offsetParent) };
    document.getElementById('st-sound').click(); document.getElementById('st-music').click(); return r; });
  check(snd.muted && snd.music && snd.label && snd.barHidden, "Sound and Music switch from the sheet (their top-bar buttons are gone)", snd);
  await page.tap('#gs-close'); await page.waitForTimeout(150);
  const gs3 = await page.evaluate(() => ({ open: GAME_SETTINGS.isOpen(), back: document.getElementById('settings-panel').contains(document.getElementById('st-dice-block')), rows: document.querySelectorAll('#settings-panel .st-row').length }));
  check(gs.open && gs.rows === 12 && gs.fits, 'in-match Settings: the ⚙ button opens a sheet with the 12 settings that can change mid-match, fitting a phone', gs);
  check(gs2.dice !== gs.dice && gs2.stored === (gs2.dice === 'On' ? '1' : '0'), 'a switch in the sheet changes the setting', [gs, gs2]);
  check(!gs3.open && gs3.back, "Done closes it and the rows go back to the title screen's Settings", gs3);
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
    const r = document.getElementById('dice-tap-hint').getBoundingClientRect(), c = document.getElementById('dice-modal-card').getBoundingClientRect();
    return { rollIn: r.bottom <= innerHeight && r.top >= 0, card: c.height <= innerHeight };
  });
  await ls.page.waitForTimeout(300);
  await ls.page.screenshot({ path: OUT + '/dice-waiting-landscape.png' });
  check(lsr.rollIn && lsr.card, 'landscape phone: the block window and its tap-to-roll line fit the screen', lsr);
  check(!ls.errors.length, 'no page errors (landscape)', ls.errors.slice(0, 3));
  await done(browser);
})();
