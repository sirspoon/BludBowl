// Replay checks for a thrown team-mate carrying the ball.
//  - Own matches: stages a throw of a ball carrier in a live match (forcing sixes), saves the match the way "My matches" does, and
//    plays it in the replay viewer: the player must stay on the pitch while in the air, fly to where they land with the ball in
//    hand, and the close-up must have the ball.
//  - FUMBBL: with --fumbbl <matchId> it also downloads that match's replay from fumbbl.com and checks every throw the same way
//    (FUMBBL marks a thrown player 'picked up' (16) then 'in the air' (21), and moves the ball to them only after they land).
//    4755096 is a match with an accurate throw of a ball carrier.
// node tools/ui-tests/replays.js [outDir] [--fumbbl <matchId>]
const { chromium, check, done, openGame } = require('./lib');
const zlib = require('zlib');

const fumbblId = (() => { const i = process.argv.indexOf('--fumbbl'); return i > 0 ? process.argv[i + 1] : null; })();
// every throw in a parsed replay: its close-up's ball flag, and whether the viewer flies the thrown player (with the ball)
const throwsIn = page => page.evaluate(() => {
  const dbg = FREP.debug(), fr = dbg.D.frames, out = [];
  fr.forEach((F, i) => { if (F.replay && F.replay.kind === 'ttm') out.push({ i, ball: !!F.replay.ball, thrown: F.replay.thrown, res: F.replay.res }); });
  out.forEach(o => { for (let i = Math.max(1, o.i - 8); i <= o.i; i++) { dbg.show(i - 1, false); dbg.show(i, true); const c = fr[i]._carry; if (c && c.p.id === o.thrown) { o.flew = true; o.flewWithBall = state.ball.carrierId === c.p.id; } } });
  return out;
});

(async () => {
  const browser = await chromium.launch();
  console.log('== own match');
  const { ctx, page, errors } = await openGame(browser);
  await page.evaluate(() => { localStorage.setItem('bb-replays', '1'); AI.set(0, true); AI.set(1, true); window.launchMatch('orc', 'human', { replaceOk: true, exhibition: true }); });
  await page.waitForTimeout(2500); await page.click('#btn-lineup-confirm').catch(() => {});
  for (let i = 0; i < 90; i++) { await page.waitForTimeout(1000); if (await page.evaluate(() => state.players.filter(p => p.x >= 0).length >= 20 && state.mode === MODES.SELECT && state.activeTeam === 0)) break; }
  const staged = await page.evaluate(() => {
    AI.set(0, false); AI.set(1, false);
    const orcs = state.players.filter(p => p.team === 0 && p.x >= 0 && !p.isDown), thr = orcs.find(p => /Troll/.test(p.type)); if (!thr) return null;
    const mate = orcs.find(p => p !== thr);
    const sq = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => ({ x: thr.x + dx, y: thr.y + dy })).find(s => s.x >= 0 && s.x < 26 && s.y >= 0 && s.y < 15 && !state.players.some(p => p.x === s.x && p.y === s.y));
    mate.x = sq.x; mate.y = sq.y; state.ball.carrierId = mate.id; state.ball.x = mate.x; state.ball.y = mate.y;
    thr.skills = (thr.skills || []).filter(s => s !== 'Always Hungry'); thr.pa = 1;
    const mr = Math.random; Math.random = () => 0.995; setTimeout(() => { Math.random = mr; }, 2500);   // sixes: an accurate throw and a safe landing
    initiateThrowTeammate(thr, mate, thr.x <= 13 ? thr.x + 4 : thr.x - 4, thr.y, 0); AI.set(0, true);
    return mate.type;
  });
  check(!!staged, 'staged a Troll throwing a ball carrier', staged);
  await page.waitForTimeout(8000);
  await page.evaluate(() => { window.__file = REC.debug().now(); FREP.start(window.__file); });
  const own = await throwsIn(page);
  const vanished = await page.evaluate(() => { const fr = FREP.debug().D.frames, i = fr.findIndex(x => x.replay && x.replay.kind === 'ttm'), th = fr[i].replay.thrown - 1; return fr.slice(Math.max(0, i - 6), i).some(F => F.pos[th * 2] < 0); });
  check(own.length === 1 && own[0].ball, 'the close-up has the ball', own);
  check(!vanished, 'the thrown player stays on the pitch while in the air');
  check(own.length === 1 && own[0].flew && own[0].flewWithBall, 'the viewer flies them there with the ball');
  check(!errors.length, 'no page errors', errors);
  if (fumbblId) {
    console.log(`\n== FUMBBL match ${fumbblId}`);
    const m = await (await fetch('https://fumbbl.com/api/match/get/' + fumbblId)).json();
    let raw = Buffer.from(await (await fetch(`https://fumbbl.com/api/replay/get/${m.replayId}/gz`)).arrayBuffer());
    try { raw = zlib.gunzipSync(raw); } catch (e) {}
    await page.evaluate(txt => FREP.start(JSON.parse(txt)), raw.toString('utf8'));
    const list = await throwsIn(page);
    check(list.length > 0, `found ${list.length} throw(s)`);
    list.forEach(o => check(o.ball ? o.flew && o.flewWithBall : o.flew && !o.flewWithBall, `frame ${o.i}: ${o.res} throw ${o.ball ? 'with' : 'without'} the ball flies ${o.ball ? 'with it' : 'empty-handed'}`, o));
  }
  await ctx.close();
  await done(browser);
})();
