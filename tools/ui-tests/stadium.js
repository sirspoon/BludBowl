// Stadium & dugouts (test, ?stadium): each team's dugout shows the right players after a KO, a casualty (once the player has
// faded off the pitch), a KO'd player coming back, and a tap on a dugout player opens their stats; the setting; never in ?simtest.
// node tools/ui-tests/stadium.js [outDir]
const { chromium, OUT, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  const { page, errors } = await openGame(browser, { query: '?stadium', viewport: { width: 1280, height: 800 } });
  await page.evaluate(() => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true }); });
  for (let i = 0; i < 300; i++) {
    await page.waitForTimeout(200);
    const ok = await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
      return state.turn[0] >= 1 && state.players.filter(p => p.team === 0 && p.x >= 0 && p.x < CFG.cols && !p.isFading).length >= 3; });
    if (ok) break;
  }
  await page.evaluate(() => { CLOCK.set(1); AI.setPaused(true); ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll', 'modal-announce'].forEach(id => document.getElementById(id).classList.add('hidden')); });
  check(await page.evaluate(() => STADIUM.active() && PITCH.style === 'blades'), '?stadium: on, on the grass pitch');
  const ids = await page.evaluate(() => {
    const on = state.players.filter(p => p.team === 0 && p.x >= 0 && p.x < CFG.cols && !p.isFading && !p.isCasualty && !p.isKO);
    const occ = STADIUM.occupants(0), base = { res: occ.res.length, ko: occ.ko.length, cas: occ.cas.length };
    // a KO, as the game does it (removePlayerWithFade, then off the pitch once the fade ends)
    const a = on[0], b = on[1];
    a.isKO = true; a.inSquad = false; removePlayerWithFade(a, 'KNOCKED OUT', "KO'd - test", false);
    b.isCasualty = true; b.casualtyStatus = 'Dead'; removePlayerWithFade(b, 'CASUALTY', 'Dead - test', false);
    const during = STADIUM.occupants(0);
    return { a: a.id, b: b.id, base, koDuring: during.ko.some(p => p.id === a.id), carried: STADIUM.carried(a.id) && STADIUM.carried(b.id) };
  });
  check(!ids.koDuring, 'a KO\'d player still fading off the pitch is not in the dugout yet');
  check(ids.carried, 'the KO\'d and the dead player are being stretchered off (the 2 s scene)');
  await page.waitForTimeout(3100);   // (the medics take ~2.5 s)
  const after = await page.evaluate(({ a, b }) => { finishFades(); render(); const o = STADIUM.occupants(0), o1 = STADIUM.occupants(1);
    return { ko: o.ko.map(p => p.id), cas: o.cas.map(p => p.id), res: o.res.map(p => p.id), other: [...o1.ko, ...o1.cas].map(p => p.id), boxes: STADIUM.boxes().map(x => x.id) }; }, ids);
  check(after.ko.includes(ids.a) && !after.res.includes(ids.a), "the KO'd player is in their team's Knocked Out bay", after.ko);
  check(after.cas.includes(ids.b), 'the dead player is in the Casualties bay', after.cas);
  check(!after.other.includes(ids.a) && !after.other.includes(ids.b), "and not in the other team's dugout");
  check(after.boxes.includes(ids.a) && after.boxes.includes(ids.b), 'both are drawn (tap boxes) in the dugout');
  // a tap on the KO'd player in the dugout: show the dugout, then click on them
  // (the game ignores taps on the pitch while the computer decides: a person coaches both sides from here)
  const pt = await page.evaluate(a => { AI.set(0, false); AI.set(1, false); const d = STADIUM.dugRect(0), ts = CFG.tileSize, z = 1.1; state.camera.zoom = z;
    state.camera.x = innerWidth / 2 - (d.x + d.w / 2) * ts * z; state.camera.y = innerHeight / 2 - (d.y + d.h / 2) * ts * z; camUserAt = performance.now() + 1e7; render();
    const bx = STADIUM.boxes().find(x => x.id === a); return { x: state.camera.x + (bx.x + bx.w / 2) * z, y: state.camera.y + (bx.y + bx.h / 2) * z }; }, ids.a);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(300);
  let glowSeen = false;
  // (a dice result still showing takes the first tap to put it away, as in play)
  if (!/In the dugout/.test(await page.evaluate(() => document.getElementById('stats-panel').textContent))) { await page.waitForTimeout(500); await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(300); }
  const panel = await page.evaluate(() => ({ t: document.getElementById('stats-panel').textContent.replace(/\s+/g, ' '), tb: document.getElementById('action-toolbar').classList.contains('hidden') }));
  check(/In the dugout: Knocked out/.test(panel.t) && panel.tb, 'tapping a dugout player shows them in the Unit Panel (no action buttons)', panel.t.slice(0, 120));
  await page.screenshot({ path: OUT + '/stadium-dugout.png' });
  // back on a 4+: from the KO bay to the reserves
  const back = await page.evaluate(a => { const p = getPlayerById(a); p.isKO = false; p.isReserve = true; p.x = -9; p.y = -9; render(); const o = STADIUM.occupants(0); return { res: o.res.some(q => q.id === a), ko: o.ko.some(q => q.id === a) }; }, ids.a);
  check(back.res && !back.ko, 'a KO\'d player who comes round moves to Reserves', back);
  // a bloody match: seven of a team knocked out at once all fit in the Knocked Out bay (a third of the dugout), none overlapping
  const crowd = await page.evaluate(() => {
    const ps = state.players.filter(p => p.team === 1).slice(0, 7); ps.forEach(p => { p.isKO = true; p.isReserve = false; p.isFading = false; p.x = -9; p.y = -9; });
    render(); const d = STADIUM.dugRect(1), ts = CFG.tileSize, bx0 = (d.x + d.w / 3) * ts, bx1 = (d.x + 2 * d.w / 3) * ts;
    const bs = STADIUM.boxes().filter(b => ps.some(p => p.id === b.id));
    const inside = bs.every(b => b.x >= bx0 - 1 && b.x + b.w <= bx1 + 1 && b.y >= d.y * ts - 1 && b.y + b.h <= (d.y + d.h) * ts + 1);
    const overlap = bs.some((a, i) => bs.some((b, j) => j > i && a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1));
    return { n: bs.length, inside, overlap };
  });
  check(crowd.n === 7 && crowd.inside && !crowd.overlap, 'seven knocked out at once all fit in the Knocked Out bay, none overlapping', crowd);
  // the view stays near the pitch: zoomed in, a drag far away is pulled back to the dugouts' edge; zoomed right out, the pitch stays on screen;
  // the game's own starting view isn't moved
  const cam = await page.evaluate(() => {
    const ts = CFG.tileSize, W = CFG.cols * ts, H = CFG.rows * ts, view = () => { const z = state.camera.zoom; return { x0: -state.camera.x / z, y0: -state.camera.y / z, x1: (innerWidth - state.camera.x) / z, y1: (innerHeight - state.camera.y) / z }; };
    state.camera.zoom = 2; state.camera.x = 9000; state.camera.y = -9000; render(); const a = view();
    state.camera.zoom = 0.4; state.camera.x = -9000; state.camera.y = 9000; render(); const b = view();
    resizeCanvas(); const before = { x: state.camera.x, y: state.camera.y }; render(); const moved = Math.abs(before.x - state.camera.x) + Math.abs(before.y - state.camera.y);
    return { inX: a.x0 >= -10.5 * ts && a.x1 <= W + 10.5 * ts, inY: a.y0 >= -9 * ts && a.y1 <= H + 9 * ts, pitchSeen: b.x0 <= 0 && b.x1 >= W && b.y0 <= 0 && b.y1 >= H, moved };
  });
  check(cam.inX && cam.inY, 'zoomed in, the view can\'t be dragged far from the pitch', cam);
  check(cam.pitchSeen, 'zoomed right out, the pitch stays on screen', cam);
  check(cam.moved < 1, 'the starting view is left alone', cam);
  // the secret option "Reposition opposition": the button in the person's turn, tap a computer player, tap an empty square; the ball goes with them
  const rp = await page.evaluate(() => {
    localStorage.setItem('bb-secret', JSON.stringify({ repo: true })); return true; });
  // (the option is read when the page loads: reload, start a match, then hand team 0 to a person in an exhibition)
  await page.reload(); await page.waitForTimeout(1200);
  await page.evaluate(() => { document.getElementById('splash').style.display = 'none'; localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch('human', 'orc', { replaceOk: true, exhibition: true }); });
  for (let i = 0; i < 200; i++) { await page.waitForTimeout(200); if (await page.evaluate(() => { try { CLOCK.set(16); } catch (e) {} const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click(); return state.turn[0] >= 1 && state.mode === MODES.IDLE; })) break; }
  const pick = await page.evaluate(() => {
    CLOCK.set(1); AI.setPaused(true); AI.set(0, false); state.cheatSide = 0; state.activeTeam = 0; state.mode = MODES.IDLE;
    ['modal-choice', 'modal-dice', 'modal-roll', 'modal-team-reroll', 'modal-announce', 'turn-banner'].forEach(id => document.getElementById(id).classList.add('hidden'));
    const foe = state.players.find(p => p.team === 1 && p.x >= 0 && p.x < CFG.cols && !p.isFading && !p.isCasualty);
    state.ball.carrierId = foe.id; state.ball.x = foe.x; state.ball.y = foe.y;   // (give them the ball, to see it go with them)
    let free = null; for (let x = 0; x < CFG.cols && !free; x++) if (!getPlayer(x, 0)) free = { x, y: 0 };
    const ts = CFG.tileSize, z = 0.8; state.camera.zoom = z; state.camera.x = 20; state.camera.y = 140; camUserAt = performance.now() + 1e7; render();
    const at = q => ({ x: state.camera.x + (q.x + 0.5) * ts * z, y: state.camera.y + (q.y + 0.5) * ts * z });
    return { id: foe.id, a: at(foe), b: at(free), free };
  });
  // (the computer's last move may still be finishing: wait until that player has stood still for a second)
  for (let i = 0, last = '', same = 0; i < 40 && same < 4; i++) { await page.waitForTimeout(250); const now = await page.evaluate(id => { const p = getPlayerById(id); return p.x + ',' + p.y + (isWalking() ? 'w' : ''); }, pick.id); same = now === last && !now.endsWith('w') ? same + 1 : 0; last = now; }
  await page.evaluate(id => { const p = getPlayerById(id); state.ball.carrierId = id; state.ball.x = p.x; state.ball.y = p.y; }, pick.id);
  const btn = await page.evaluate(() => { const b = document.getElementById('secret-repo'); return b && b.style.display !== 'none'; });
  check(btn, 'Reposition opposition: the button shows in the person\'s turn');
  // (a dice result still showing takes the first tap to put it away, as in play: try the three taps again if nothing moved)
  for (let tries = 0; tries < 3; tries++) {
    await page.waitForTimeout(tries ? 1500 : 2500);
    // (the tap positions from the camera as it is now, in case it has shifted)
    const at = await page.evaluate(([id, f]) => { const p = getPlayerById(id), ts = CFG.tileSize, z = state.camera.zoom, r = canvas.getBoundingClientRect(), sc = q => ({ x: r.left + state.camera.x + (q.x + 0.5) * ts * z, y: r.top + state.camera.y + (q.y + 0.5) * ts * z }); return { a: sc(p), b: sc(f) }; }, [pick.id, pick.free]);
    await page.click('#secret-repo'); await page.waitForTimeout(100);
    await page.mouse.click(at.a.x, at.a.y); await page.waitForTimeout(150);
    if (!tries) { glowSeen = await page.evaluate(id => { const p = getPlayerById(id), g = markGlow(p); return !!(g && CHEAT.repoPicked() === id); }, pick.id); await page.screenshot({ path: OUT + '/stadium-reposition-picked.png' }); }
    await page.mouse.click(at.b.x, at.b.y); await page.waitForTimeout(150);
    if (process.env.DBG) console.log(JSON.stringify(await page.evaluate(() => [document.getElementById('secret-repo').textContent, state.camera, state.mode])), JSON.stringify(at));
    if (await page.evaluate(([id, f]) => { const p = getPlayerById(id); return p.x === f.x && p.y === f.y; }, [pick.id, pick.free])) break;
    await page.evaluate(() => { const b = document.getElementById('secret-repo'); if (b && !/Reposition$/.test(b.textContent)) b.click(); });   // (cancel a half-done pick)
  }
  const moved = await page.evaluate(([id, f]) => { const p = getPlayerById(id); return { x: p.x, y: p.y, ball: state.ball.carrierId === id && state.ball.x === f.x && state.ball.y === f.y }; }, [pick.id, pick.free]);
  check(glowSeen, 'Reposition opposition: the picked computer player\'s base glows (pulsing yellow) until placed');
  check(moved.x === pick.free.x && moved.y === pick.free.y && moved.ball, 'Reposition opposition: the computer player (and the ball they carry) moves to the tapped square', moved);
  await page.screenshot({ path: OUT + '/stadium-reposition.png' });
  await page.evaluate(() => localStorage.removeItem('bb-secret'));
  // the setting
  const st = await page.evaluate(() => { localStorage.removeItem('bb-stadium'); STADIUM.set(false); const q = STADIUM.query; STADIUM.set(true); const v = localStorage.getItem('bb-stadium'); STADIUM.set(false); return { q, v, off: localStorage.getItem('bb-stadium') }; });
  check(st.v === '1' && st.off === '0', 'Settings switch saves bb-stadium', st);
  check(!errors.length, 'no page errors', errors.slice(0, 3));
  // the other themed pitches have their own stadiums (?stadium=elven / =shanty / =worn / =flagstone / =jungle): on, drawn without errors, with their own line colour
  for (const [st, race] of [['elven', 'highelf'], ['shanty', 'orc'], ['worn', 'human'], ['flagstone', 'goblin'], ['jungle', 'lizardmen'], ['graveyard', 'undead'], ['brimstone', 'khorne'], ['woodland', 'woodelf'], ['warpstone', 'skaven'], ['blackark', 'darkelf'], ['dwarfhold', 'dwarf'], ['wastes', 'ogre'], ['plague', 'nurgle'], ['bretonnia', 'bretonnian'], ['ziggurat', 'chaosdwarf'], ['altdorf', 'human']]) {
    const s3 = await openGame(browser, { query: '?stadium=' + st });
    const r3 = await s3.page.evaluate(([race]) => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch(race, 'human', { replaceOk: true }); return true; }, [race]);
    await s3.page.waitForTimeout(2500);
    const o = await s3.page.evaluate(() => { drawFrame(); return { on: STADIUM.active(), style: PITCH.style, line: STADIUM.lineCol() }; });
    check(r3 && o.on && o.style === st && !s3.errors.length, `${st} pitch: its own stadium is drawn`, Object.assign(o, { errors: s3.errors.slice(0, 2) }));
    await s3.page.screenshot({ path: OUT + `/stadium-${st}.png` }); await s3.ctx.close();
  }
  // ?simtest: never drawn
  const s2 = await openGame(browser, { query: '?simtest&stadium' });
  check(await s2.page.evaluate(() => !STADIUM.active()), 'not drawn in ?simtest');
  await done(browser);
})();
