// The Chaos Wastes weather table and pitch (v4.96): node tools/ui-tests/chaos-wastes.js [outDir] [--quick] [--only 9,12]
//  - the Weather option on the exhibition screen and in the two-device lobby
//  - every 2D6 result forced on the pre-match roll (Math.random replaced for those two dice) in a fast computer-vs-computer match
//    (?simtest): its start-of-drive effect happens, nothing errors or stalls, and nothing it gave is left on a player afterwards
//  - Changing Weather bringing in a Chaos Wastes result mid-kick-off
//  - Gaze of the Gods picked by a person (the pick banner on the pitch)
//  - screenshots of the pitch (desktop, phone portrait and landscape, a set-up, the block close-up backdrop)
const { chromium, devices, OUT, check, done, openGame, setSelect } = require('./lib');
const QUICK = process.argv.includes('--quick');
const KEYS = [null, null, 'cw_warpfire', 'cw_winds', 'cw_bloodrain', 'cw_gravity', 'cw_gale', 'cw_overcast', 'cw_spores', 'cw_lightning', 'cw_musk', 'cw_gaze', 'cw_maw'];
const MARK = { cw_warpfire: /CHAOS WARPFIRE/, cw_winds: /WINDS OF CHANGE/, cw_gravity: /GRAVITY FLUX/, cw_spores: /CHOKING SPORES/, cw_musk: /SOPORIFIC MUSK/, cw_gaze: /GAZE OF THE GODS/, cw_maw: /SLAVERING MAW/ };
const face = f => (f - 0.5) / 6;

async function sim(browser, races, hook) {
  const { ctx, page, errors } = await openGame(browser, { query: '?simtest', viewport: { width: 900, height: 700 } });
  await page.evaluate(() => { try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {}
    window.CWLOG = []; const L = log; window.log = function (m) { if (/CHAOS|WINDS OF|GRAVITY|GALE|SPORES|WARP LIGHTNING|MUSK|GAZE|MAW|breathe again|mutates|New weather|WEATHER \(/.test(String(m))) window.CWLOG.push(String(m)); return L.apply(this, arguments); }; });
  await page.evaluate(hook);
  await page.evaluate(([a, b]) => { setWeatherPref('chaos'); AI.set(0, true); AI.set(1, true); window.launchMatch(a, b, { replaceOk: true, exhibition: true }); }, races);
  const t0 = Date.now(); let res = null;
  while (Date.now() - t0 < 150000) {
    await page.waitForTimeout(300);
    await page.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click(); });
    res = await page.evaluate(() => ({ over: !!state.isGameOver, wt: state.wtable, w: state.weather.key, score: [state.score[0], state.score[1]], left: state.players.filter(p => p.cwSkills || p.cwDelta || p.cwSpores).length, log: window.CWLOG }));
    if (res.over) break;
  }
  if (!res.over) res.stuck = await page.evaluate(() => ({ mode: state.mode, half: state.half, turn: [state.turn[0], state.turn[1]], pick: !!state.pitchPick }));
  res.errors = errors; await ctx.close(); return res;
}

(async () => {
  const browser = await chromium.launch();
  // 1. the options
  {
    const { ctx, page, errors } = await openGame(browser);
    const o = await page.evaluate(() => ({ ex: [...document.querySelectorAll('#sel-weather option')].map(o => o.value), lobby: [...document.querySelectorAll('#nl-weather option')].map(o => o.value), pitch: [...document.querySelectorAll('#sel-pitch option')].some(o => o.value === 'chaos') }));
    check(o.ex.join() === 'std,chaos', 'exhibition screen has the Weather option', o.ex);
    check(o.lobby.join() === 'std,chaos', 'two-device lobby has the Weather option', o.lobby);
    check(o.pitch, 'Chaos Wastes is in the Pitch list');
    await setSelect(page, '#sel-pitch', 'blades'); await setSelect(page, '#sel-weather', 'chaos');
    const tip = await page.evaluate(() => !document.getElementById('wx-pitch-tip').classList.contains('hidden'));
    check(tip, 'picking Chaos Wastes weather offers the Chaos Wastes pitch');
    await page.evaluate(() => document.getElementById('wx-pitch-tip').click());
    check(await page.evaluate(() => pitchPref === 'chaos' && PITCH.style === 'chaos'), 'the offer switches the pitch');
    check(await page.evaluate(() => { state.wtable = 'chaos'; const a = []; for (let r = 2; r <= 12; r++) a.push(weatherFromRoll(r)); state.wtable = 'std'; return a.join() === CW_BY_ROLL.slice(2).join() && weatherFromRoll(7) === 'perfect'; }), 'weatherFromRoll follows the chosen table');
    await page.evaluate(() => { setWeatherPref('std'); setPitchPref('home'); });
    check(!errors.length, 'no page errors on the menu', errors);
    await ctx.close();
  }
  // 1b. tournaments: the Weather choice in the form (Chaos Wastes by default with the Glory on the Gridiron 2 rules), kept by the cup and used in its matches
  {
    const { ctx, page, errors } = await openGame(browser, { device: 'Pixel 7' });
    const chip = () => page.evaluate(() => { const on = document.querySelector('#cup-hub [data-cset^="weather|"].on'); return on ? on.dataset.cset.split('|')[1] : null; });
    await page.evaluate(() => { CUP.open(); document.querySelector('[data-cact="new"]').click(); }); await page.waitForTimeout(200);
    await setSelect(page, '#cp-rules', 'gw'); await page.waitForTimeout(100);
    check(await chip() === 'std', 'tournament form: Weather is Standard with GW rules', await chip());
    await setSelect(page, '#cp-rules', 'gotg2'); await page.waitForTimeout(100);
    check(await chip() === 'chaos', 'tournament form: Weather defaults to Chaos Wastes with the Glory on the Gridiron 2 rules', await chip());
    await page.screenshot({ path: OUT + '/chaos-cup-form.png', fullPage: false });
    await page.evaluate(() => document.querySelector('[data-cset="weather|std"]').click()); await page.waitForTimeout(100);
    check(await chip() === 'std', 'tournament form: Weather can be switched to Standard');
    await page.evaluate(() => document.querySelector('[data-cset="weather|chaos"]').click()); await page.waitForTimeout(100);
    await page.evaluate(() => document.querySelector('[data-cact="create"]').click()); await page.waitForTimeout(400);
    const cp = await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem('bb-cups') || '[]'), l = Array.isArray(raw) ? raw : (raw.cups || Object.values(raw)); const c = l.find(x => x && x.rules === 'gotg2'); return c ? { wx: c.wx, rules: c.rules } : null; });
    check(cp && cp.wx === 'chaos' && cp.rules === 'gotg2', 'the new cup keeps the Chaos Wastes weather', cp);
    check(await page.evaluate(() => /Chaos Wastes weather/.test(document.getElementById('cup-hub').textContent)), 'the cup page says it uses the Chaos Wastes weather');
    check(await page.evaluate(() => { state.wtable = null; window.launchMatch('orc', 'human', { replaceOk: true, cup: { cid: 'x', key: '0:0', ko: true, wx: 'chaos' } }); return state.wtable; }) === 'chaos', 'a tie launched from it plays with the Chaos Wastes table');
    check(await page.evaluate(() => { window.launchMatch('orc', 'human', { replaceOk: true, cup: { cid: 'x', key: '0:0', ko: true } }); return state.wtable; }) === 'std', 'a cup without it (older cups) keeps the standard table');
    check(await page.evaluate(() => { return typeof CUP.weatherField === 'function' && CUP.wxOf({ rules: 'gotg2' }) === 'chaos' && CUP.wxOf({ rules: 'gotg2', fmt: 'sevens' }) === 'std'; }), 'the online tournament form uses the same choice');
    await page.evaluate(() => { document.getElementById('cup-hub').classList.add('hidden'); OTOUR.open(); const b = document.querySelector('#otour-hub [data-ot="new"]'); if (b) b.click(); }); await page.waitForTimeout(200);
    await setSelect(page, '#ot-rules', 'gotg2'); await page.waitForTimeout(100);
    const ot = await page.evaluate(() => { const on = document.querySelector('#otour-hub [data-k="weather"].on'); return on ? on.dataset.v : null; });
    check(ot === 'chaos', 'online tournament form: Weather defaults to Chaos Wastes with the Glory on the Gridiron 2 rules', ot);
    await page.screenshot({ path: OUT + '/chaos-otour-form.png' });
    check(!errors.length, 'tournament form: no page errors', errors);
    await ctx.close();
  }
  // 2. every result on the pre-match roll
  const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',').map(Number) : null;
  const totals = ONLY || (QUICK ? [2, 3, 11, 12] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const races = ONLY ? ['skaven', 'woodelf'] : ['orc', 'human', 'skaven', 'dwarf', 'chaoschosen', 'woodelf'];
  for (let i = 0; i < totals.length; i += 4) {
    await Promise.all(totals.slice(i, i + 4).map(async (T, j) => {
      const d1 = Math.min(6, T - 1), d2 = T - d1, rr = races[(i + j) % races.length];
      const r = await sim(browser, [rr, races[(i + j + 1) % races.length]], new Function(`const orig = runPreGame; window.runPreGame = function () { const mr = Math.random; let n = 0;
        Math.random = () => { n++; return n === 3 ? ${face(d1)} : n === 4 ? ${face(d2)} : mr(); }; try { return orig.apply(this, arguments); } finally { Math.random = mr; } };`));
      const key = KEYS[T], mk = MARK[key], hits = mk ? r.log.filter(l => mk.test(l)).length : null;
      check(r.over && !r.errors.length && r.wt === 'chaos', `${T} (${key}): the match plays to the end`, r.over ? { score: r.score, errors: r.errors.slice(0, 2) } : r.stuck);
      check(r.log.some(l => l.includes('WEATHER (' + d1 + '+' + d2 + '=' + T + ')')), `${T}: the forced roll gives ${key}`, r.log.slice(0, 1));
      if (mk) check(hits > 0, `${T} (${key}): its start-of-drive effect happened`, `${hits} log lines; e.g. ${r.log.filter(l => mk.test(l))[0] || ''}`);
      check(r.left === 0, `${T}: nothing from the weather is left on a player after the match`);
      if (key === 'cw_lightning') check(r.score[0] + r.score[1] === 0 || r.log.filter(l => /WARP LIGHTNING!/.test(l)).length > 0, '9: Warp Lightning strikes after touchdowns (Changing Weather can end it first)', { tds: r.score, strikes: r.log.filter(l => /WARP LIGHTNING!/.test(l)).length });
      if (key === 'cw_gale' || key === 'cw_lightning') console.log(`      ${key}: ${r.log.filter(l => /GALE!|WARP LIGHTNING!/.test(l)).length} trigger(s), e.g. ${r.log.filter(l => /GALE!|WARP LIGHTNING!/.test(l))[0] || '(none this match)'}`);
    }));
  }
  if (ONLY) { await done(browser); return; }
  // 3. Changing Weather brings in Gaze of the Gods (11) and the Slavering Maw (12) during a kick-off
  for (const [T, key] of [[11, 'cw_gaze'], [12, 'cw_maw']]) {
    const r = await sim(browser, ['orc', 'human'], new Function(`let once = 0; const orig = startKickoffEvent; window.startKickoffEvent = function () { if (once++) return orig.apply(this, arguments); const mr = Math.random; let n = 0;
      Math.random = () => { n++; return n <= 2 ? ${face(4)} : n === 3 ? ${face(Math.min(6, T - 1))} : n === 4 ? ${face(T - Math.min(6, T - 1))} : mr(); }; try { return orig.apply(this, arguments); } finally { Math.random = mr; } };`));
    check(r.over && !r.errors.length, `Changing Weather to ${key} mid-kick-off: the match plays on`, r.over ? r.errors.slice(0, 2) : r.stuck);
    check(r.log.some(l => /New weather/.test(l) && l.includes(key === 'cw_gaze' ? 'Gaze' : 'Maw')) && r.log.some(l => MARK[key].test(l) && !/New weather/.test(l)), `Changing Weather to ${key}: its effect happens straight away`);
  }
  // 4. a person picks for Gaze of the Gods (normal speed): the pick banner, a tap on a player, and the match goes on
  {
    const { ctx, page, errors } = await openGame(browser, { viewport: { width: 1100, height: 750 } });
    await page.evaluate(() => { try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {} setWeatherPref('chaos'); AI.set(0, true); AI.set(1, true); window.launchMatch('orc', 'human', { replaceOk: true, exhibition: true }); });
    let stage = 0, picked = null; const t0 = Date.now();
    while (Date.now() - t0 < 90000 && stage < 3) {
      await page.waitForTimeout(200);
      stage = await page.evaluate(st => {
        const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click();
        if (st === 0 && state.weather && state.weather.roll) { setWeather('cw_gaze', 11); return 1; }
        if (st === 1 && state.cwDone) { AI.set(0, false); AI.set(1, false); return 2; }
        if (st === 2 && state.pitchPick) { const c = state.pitchPick.cells[0]; window.__pk = c.data.id; pitchPickTap(c.x, c.y); pitchPickTap(c.x, c.y); return state.pitchPick ? 2 : 3; }
        return st;
      }, stage);
    }
    await page.screenshot({ path: OUT + '/chaos-gaze-pick.png' });
    check(stage === 3, 'Gaze of the Gods: a person gets the pick banner and picks a player', stage);
    await page.evaluate(() => { if (state.pitchPick) { const c = state.pitchPick.cells[0]; pitchPickTap(c.x, c.y); pitchPickTap(c.x, c.y); } AI.set(0, true); AI.set(1, true); });
    await page.waitForTimeout(6000);
    const after = await page.evaluate(() => ({ mode: state.mode, log: [...document.querySelectorAll('#message-log > *')].map(e => e.textContent).filter(t => /GAZE OF THE GODS \(/.test(t)) }));
    check(after.log.length >= 1, 'the gods judge the picked players', after.log);
    check(!errors.length, 'no page errors', errors);
    await ctx.close();
  }
  // 5. the pitch: desktop, phone portrait and landscape, a set-up, and the block close-up
  for (const [name, opts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', { device: 'Pixel 7' }], ['phone-land', { device: 'Pixel 7 landscape' }]]) {
    const { ctx, page, errors } = await openGame(browser, opts);
    await page.evaluate(() => { try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {} setPitchPref('chaos'); setWeatherPref('chaos'); AI.set(0, true); AI.set(1, true); window.launchMatch('chaoschosen', 'human', { replaceOk: true, exhibition: true }); });
    let shot = false; const t0 = Date.now();
    while (Date.now() - t0 < 60000) {
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) b.click(); return state.mode === MODES.SETUP ? 'setup' : state.mode === MODES.KICKOFF_TARGET ? 'kick' : ''; });
      if (m === 'setup' && !shot) { await page.waitForTimeout(1200); await page.screenshot({ path: `${OUT}/chaos-pitch-${name}-setup.png` }); shot = true; }
      if (m === 'kick') break;
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/chaos-pitch-${name}.png` });
    if (name === 'desktop') {   // the block close-up's backdrop
      const ok = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 720; c.height = 264; const g = c.getContext('2d'); g.scale(2, 2); g.drawImage(clashBackdrop(360, 132, 118), 0, 0); window.__bd = c.toDataURL(); return true; });
      const b64 = await page.evaluate(() => window.__bd.split(',')[1]); require('fs').writeFileSync(`${OUT}/chaos-backdrop.png`, Buffer.from(b64, 'base64'));
      check(ok, 'the close-up backdrop draws');
    }
    check(await page.evaluate(() => PITCH.style === 'chaos' && !!PITCH.tex && !!PITCH.glow), `${name}: the Chaos Wastes pitch is built (with its glow layer)`);
    check(!errors.length, `${name}: no page errors`, errors);
    await ctx.close();
  }
  await done(browser);
})();
