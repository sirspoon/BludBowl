// node ai-training/bb-setups.js RACES N OUT.json
// The BludBowl computer's kick-off set-ups, in the same form as fumbbl-setups.py --json (own end zone on the left), from
// mirror matches in the ?simtest test mode. Then: python3 ai-training/fumbbl-setups.py --bb OUT.json. Needs a web server on :8765.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, OUT = 'bb-setups.json'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(',');
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(() => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} });
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        window.SU = []; let kick = 0;
        const R = window.resolveKickoff; window.resolveKickoff = function () { try {
          kick++; const kt = state.kickoff.kickingTeam;
          [0, 1].forEach(t => {
            const pl = state.players.filter(q => q.team === t && !q.isReserve && !q.isKO && !q.isCasualty && q.x >= 0 && q.x < CFG.cols).map(q => ({ pos: q.type, short: q.type[0], ma: q.ma, st: q.st, ag: q.ag, av: q.av, skills: q.skills || [], x: t === 0 ? q.x : CFG.cols - 1 - q.x, y: q.y }));
            SU.push({ replay: 'bb', race, coach: 'BludBowl AI', half: state.half, kick, kicking: t === kt, opp: race, players: pl });
          });
        } catch (e) {} return R.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => state.isGameOver)) break; }
      out.push(...await p.evaluate(() => SU)); await p.close();
    }
  }));
  await b.close(); require('fs').writeFileSync(OUT, JSON.stringify(out)); console.log(`${out.length} set-ups written to ${OUT}`);
})();
