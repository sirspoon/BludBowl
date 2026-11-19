// Night Goblins: Squig Rage and Squig Restraint, forced with loaded dice in a staged position, then a few fast computer matches.
// node tools/ui-tests/squig-rage.js [outDir] [--n=4]
const { chromium, OUT, check, done, openGame } = require('./lib');
(async () => {
  const browser = await chromium.launch();
  const { page, errors } = await openGame(browser, { query: '?simtest' });
  // a computer match until play is under way, then both sides handed back to people (nothing moves on its own)
  await page.evaluate(() => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch('nightgoblin', 'orc', { replaceOk: true }); });
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(250);
    const ok = await page.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
      return state.turn[0] >= 1 && state.turn[1] >= 1 && state.activeTeam === 0 && [MODES.IDLE, MODES.SELECT].includes(state.mode); });
    if (ok) break;
  }
  await page.evaluate(() => {
    AI.set(0, false); AI.set(1, false);
    const R0 = Math.random; window.__R0 = R0; window.__q = [];
    Math.random = () => (window.__q.length ? (window.__q.shift() - 1) / 6 + 0.01 : R0());   // loaded dice: the queued D6 results first
    // stage a position: only the listed players on the pitch, everyone else in the dugout
    window.__scene = list => {
      document.getElementById('modal-choice').classList.add('hidden');
      if (state.pitchPick) endPitchPick();
      const used = new Set(), got = [];
      state.players.forEach(p => { p.x = -10; p.y = -10; p.isReserve = true; });
      list.forEach(([team, type, x, y, down]) => {
        const p = state.players.find(q => q.team === team && q.type === type && !used.has(q.id) && !q.isCasualty && !q.isKO && !q.isEjected);
        used.add(p.id); Object.assign(p, { x, y, isReserve: false, isDown: !!down, isStunned: false, isDistracted: false, hasActed: false, hasBlocked: false,
          actionTaken: null, pendingAct: false, activatedAt: null, remainingMA: p.ma, rushes: 2, jumpedUp: false, jumpStoodAt: null, squigForced: false });
        got.push(p);
      });
      Object.assign(state.ball, { carrierId: null, x: 25, y: 14 });
      Object.assign(state, { activeTeam: 0, mode: MODES.IDLE, blitzUsed: false, passUsed: false, handoffUsed: false, foulUsed: false, turnActed: false });
      state.rr[0] = 0; window.__q = [];
      return got;
    };
    window.__declare = (p, btn) => { state.selectedId = p.id; refreshSelection(p); document.getElementById(btn).onclick(); };
  });
  const S = (fn, arg) => page.evaluate(fn, arg);

  // ---- Squig Restraint: a Standing Herder within 3 squares spares the roll
  const rs = await S(() => {
    const [h, g] = __scene([[0, 'Squig Hopper', 10, 7], [0, 'Squig Herder', 13, 7], [1, 'Lineman', 20, 2]]);
    const a = squigRolls(h); g.isDown = true; const b = squigRolls(h); g.isDown = false; g.x = 14; const c = squigRolls(h);
    g.x = 12; __declare(h, 'btn-action-move'); let ok; commitAction(h, r => { ok = r; });
    const log = [...document.querySelectorAll('#message-log > *')].slice(-3).map(e => e.textContent);
    return { a, b, c, ok, mode: state.mode === MODES.ACTION_MOVE, log, herder: squigRolls(g) };
  });
  check(rs.a === false && rs.b === true && rs.c === true, 'Squig Restraint: no roll with a Standing Herder 3 squares away; a roll if he is Prone or 4 away', rs);
  check(rs.ok === true && rs.mode && rs.log.some(l => /Squig Restraint/.test(l)), 'a calmed Squig just gets on with its Move (logged)', rs.log);
  check(rs.herder === null, 'the Herder himself has no Squig Rage');

  // ---- 1-2 next to an opponent: a Block (a declared Blitz is given back)
  const fb = await S(() => {
    const [h, o] = __scene([[0, 'Squig Hopper', 10, 7], [1, 'Lineman', 11, 7]]);
    __declare(h, 'btn-action-blitz'); const usedAtDeclare = state.blitzUsed;
    window.__q = [2]; let ok; commitAction(h, r => { ok = r; });
    return { usedAtDeclare, ok, act: h.actionTaken, forced: h.squigForced, block: state.mode === MODES.ACTION_BLOCK, blitzUsed: state.blitzUsed, targets: state.targets.includes(o.id),
      endHidden: document.getElementById('btn-end-action').classList.contains('hidden'), cancelHidden: document.getElementById('btn-cancel-action').classList.contains('hidden') };
  });
  check(fb.usedAtDeclare && fb.ok === false && fb.act === 'block' && fb.forced && fb.block && fb.targets, 'a 2: the Squig must Block the opponent it marks', fb);
  check(fb.blitzUsed === false, "the Blitz it had declared isn't used up (the roll comes before declaring)", fb);
  check(fb.endHidden && fb.cancelHidden, "the Block can't be cancelled or skipped", fb);
  await page.screenshot({ path: OUT + '/squig-forced-block.png' });

  // ---- a Squig Wrangler (Ball & Chain) blocks too
  const wb = await S(() => {
    const [w, o] = __scene([[0, 'Squig Wrangler', 10, 7], [1, 'Lineman', 10, 8]]);
    window.__q = [1]; __declare(w, 'btn-action-bnc');
    return { act: w.actionTaken, block: state.mode === MODES.ACTION_BLOCK, targets: state.targets.includes(o.id) };
  });
  check(wb.act === 'block' && wb.block && wb.targets, 'a raging Squig Wrangler makes a Block despite Ball & Chain', wb);

  // ---- Prone: Jump Up into the Block (an Agility test with +1)
  const jumpCase = async (q, pass) => {
    const pre = await S(q => {
      const [h, o] = __scene([[0, 'Cave Squig', 10, 7, true], [1, 'Lineman', 11, 6]]);
      __declare(h, 'btn-action-move');   // (a Move: Jump Up would stand it up for free)
      window.__q = q; window.__ok = 'pending'; commitAction(h, r => { window.__ok = r; });
      window.__h = h; window.__o = o;
      return { prompt: state.mode === MODES.ROLL_PROMPT, noCancel: document.getElementById('btn-roll-cancel').classList.contains('hidden'), title: document.getElementById('roll-title').textContent };
    }, q);
    await S(() => document.getElementById('btn-roll-confirm').click());
    for (let i = 0; i < 40 && await S(() => state.mode === MODES.ROLL_PROMPT || state.mode === MODES.LOCKED); i++) await page.waitForTimeout(150);
    return Object.assign(pre, await S(() => ({ ok: __ok, down: __h.isDown, jumped: __h.jumpedUp, acted: __h.hasActed, block: state.mode === MODES.ACTION_BLOCK, idle: state.mode === MODES.IDLE, targets: state.targets.includes(__o.id) })));
  };
  const jb = await jumpCase([1, 6]);
  check(jb.prompt && jb.noCancel && /JUMP UP/.test(jb.title), "a Prone Squig must take a Jump Up roll (it can't be called off)", jb);
  check(jb.ok === false && !jb.down && jb.jumped && jb.block && jb.targets, 'passing it, the Squig springs up into the Block', jb);
  const jf = await jumpCase([1, 1]);
  check(jf.down && jf.acted && jf.idle, 'failing it leaves the Squig Prone and ends the activation (no Turnover)', jf);

  // ---- nobody to Block, a team-mate next to it: the coach picks one to flatten (or Cancel: Distracted)
  const cn = await S(() => {
    const [h, m] = __scene([[0, 'Squig Hopper', 10, 7], [0, 'Night Goblin Lineman', 11, 7], [1, 'Lineman', 20, 2]]);
    __declare(h, 'btn-action-move'); window.__q = [1]; let ok; commitAction(h, r => { ok = r; });
    const asked = !!state.pitchPick && state.pitchPick.cells.length === 1;
    document.querySelector('#pick-banner .pb-cancel').click();
    return { asked, ok, dis: h.isDistracted, acted: h.hasActed, mate: m.isDown };
  });
  check(cn.asked && cn.ok === false && cn.dis && cn.acted && !cn.mate, 'no opponent to bite: Cancel and the Squig becomes Distracted', cn);
  const fl = await S(() => {
    const [h, m] = __scene([[0, 'Squig Hopper', 10, 7], [0, 'Night Goblin Lineman', 11, 7], [1, 'Lineman', 20, 2]]);
    __declare(h, 'btn-action-move'); window.__q = [2, 1, 1]; let ok; commitAction(h, r => { ok = r; });
    pitchPickTap(m.x, m.y); pitchPickTap(m.x, m.y);
    return { ok, mate: m.isDown, acted: h.hasActed, move: state.mode === MODES.ACTION_MOVE, turnover: state.activeTeam !== 0 };
  });
  check(fl.ok === true && fl.mate && !fl.acted && fl.move && !fl.turnover, 'or Knock Down the team-mate (no Turnover) and carry on with the Move', fl);

  // ---- the computer's choice: Distracted rather than flatten a fresh team-mate; flatten one when it has the ball
  const ai = await S(() => {
    const isAI0 = AI.isAI; AI.isAI = t => t === 0;
    try {
      let [h, m] = __scene([[0, 'Squig Hopper', 10, 7], [0, 'Night Goblin Lineman', 11, 7], [1, 'Lineman', 20, 2]]);
      h.actionTaken = 'move'; squigRage(h, 1, () => {}); const a = { dis: h.isDistracted, mate: m.isDown };
      [h, m] = __scene([[0, 'Squig Hopper', 10, 7], [0, 'Night Goblin Lineman', 11, 7], [1, 'Lineman', 20, 2]]);
      state.ball.carrierId = h.id; state.ball.x = h.x; state.ball.y = h.y; h.actionTaken = 'move'; window.__q = [1, 1];
      squigRage(h, 1, () => {}); const b = { dis: h.isDistracted, mate: m.isDown };
      return { a, b };
    } finally { AI.isAI = isAI0; }
  });
  check(!ai.a.mate && ai.a.dis, 'computer: a plain Move - it takes Distracted rather than flatten a fresh team-mate', ai.a);
  check(ai.b.mate && !ai.b.dis, 'computer: carrying the ball - it flattens the team-mate and carries on', ai.b);

  // ---- a team re-roll may be used on the Squig Rage roll
  const rr = await S(() => {
    const [h, o] = __scene([[0, 'Squig Hopper', 10, 7], [1, 'Lineman', 11, 7]]);
    state.rr[0] = 1; __declare(h, 'btn-action-move'); window.__q = [1]; let ok = 'pending'; commitAction(h, r => { ok = r; });
    const txt = document.getElementById('choice-text').textContent, shown = !document.getElementById('modal-choice').classList.contains('hidden');
    window.__q = [5]; document.getElementById('btn-choice-yes').click();
    return { shown, txt, ok, rr: state.rr[0], act: h.actionTaken };
  });
  check(rr.shown && /Squig Rage/.test(rr.txt) && rr.ok === true && rr.rr === 0 && rr.act === 'move', 'a failed Squig Rage roll can be team re-rolled (5: it acts as declared)', rr);

  check(await S(() => !!(SKILL_INFO['Squig Rage'] && SKILL_INFO['Squig Restraint'])), 'Squig Rage and Squig Restraint have skill tips');
  // ---- rulesets: GW Matched Play Tier 4; the two example packs (written before the team) put them in Tier 5
  const tr = await S(() => {
    TB.put({ id: 'ng-uktc', name: 'NG', race: 'nightgoblin', format: 'matched', rules: 'uktc11', rerolls: 1, players: Array.from({ length: 11 }, (_, i) => ({ pos: 'Lineman', name: 'P' + i })) });
    const t = TB.get('ng-uktc'), uk = TRULES.get('uktc11'), gotg = TRULES.get('gotg2');
    return { gw: MP.tier('nightgoblin'), sev: SEV.TIER.nightgoblin, uk: TRULES.allows(uk, 'nightgoblin') && TRULES.tierOf(uk, 'nightgoblin'), ukBudget: TRULES.budgetFor(uk, 'nightgoblin'),
      gotg: TRULES.allows(gotg, 'nightgoblin') && TRULES.tierOf(gotg, 'nightgoblin'), probs: CUP.unfit(t, 1150, 'uktc11'), kw: KEYWORDS.nightgoblin.CaveSquig, lg: RACE_LEAGUES.nightgoblin };
  });
  check(tr.gw === 4 && tr.sev === 4, 'GW Matched Play and Sevens: Tier 4', tr);
  check(tr.uk === 5 && tr.ukBudget === 1130 && tr.gotg === 5 && !tr.probs.some(x => /allowed/.test(x)), 'allowed in the UKTC XI (Tier 5, 1,130k) and GotG2 (Tier 5) examples', tr);
  check(tr.kw === 'Special,Squig' && tr.lg.join() === 'UC', 'keywords and league (Underworld Challenge)', tr);
  // ---- sprites: the two Linemen vary; the two Herders are one of each (the foam hand, then the horn)
  const sp = await S(() => {
    const hs = __scene([[0, 'Squig Herder', 5, 5], [0, 'Squig Herder', 7, 5]]);
    const g = hs.map(h => spriteFor(h));
    return { two: hs.length === 2, differ: g[0] !== g[1], order: g[0] === SPRITES.nightgoblin['Squig Herder'] && g[1] === SPRITE_VARIANTS.nightgoblin['Squig Herder'][1],
      all: ['Night Goblin Lineman', 'Squig Herder', 'Squig Hopper', 'Squig Wrangler', 'Cave Squig', 'Trained Troll'].every(k => SPRITES.nightgoblin[k] && SPRITES.nightgoblin[k].length === 32) };
  });
  check(sp.two && sp.differ && sp.order && sp.all, 'a sprite for every position; the first Herder has the foam hand, the second the horn', sp);
  console.log('page errors:', errors.length ? errors : 'none');
  check(!errors.length, 'no page errors', errors.slice(0, 3));

  // ---- fast computer matches: nothing errors or stalls, and how often Squig Rage fires
  const N = +(process.argv.find(a => /^--n=/.test(a)) || '--n=4').slice(4), opps = ['orc', 'human', 'dwarf', 'nightgoblin', 'skaven', 'woodelf'];
  const tot = {};
  for (let m = 0; m < N; m++) {
    const sim = await openGame(browser, { query: '?simtest' }), P = sim.page, opp = opps[m % opps.length];
    await P.evaluate(([a, b]) => { localStorage.setItem('bb-replays', '0'); AI.set(0, true); AI.set(1, true); window.launchMatch(a, b, { replaceOk: true }); }, m % 2 ? [opp, 'nightgoblin'] : ['nightgoblin', opp]);
    const t1 = Date.now(); let r = null;
    while (Date.now() - t1 < 150000) {
      await P.waitForTimeout(300);
      r = await P.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click(); return { over: !!state.isGameOver, score: [state.score[0], state.score[1]] }; });
      if (r.over) break;
    }
    const st = await P.evaluate(() => SQUIG.stats);
    Object.keys(st).forEach(k => { tot[k] = (tot[k] || 0) + st[k]; });
    check(r.over && !sim.errors.length, `computer match ${m + 1} (Night Goblins v ${opp}) finished with no errors`, Object.assign({ secs: Math.round((Date.now() - t1) / 1000), st }, r, sim.errors.length ? { err: sim.errors[0] } : {}));
    await sim.ctx.close();
  }
  console.log('Squig Rage over the matches:', JSON.stringify(tot), tot.n ? `failed ${(100 * tot.fail / tot.n).toFixed(0)}% of rolls (expect ~33%)` : '');
  await done(browser);
})();
