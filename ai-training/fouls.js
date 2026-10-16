// node ai-training/fouls.js RACES N [flags] - every computer foul: fouler, victim (positional or lineman), assists, armour broken, injury, sent off
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const [RACES, N = 2, FLAGS = ''] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const out = []; const races = RACES.split(','); let chances = 0, turns = 0;
  await Promise.all([0, 1, 2, 3].map(async w => {
    for (let k = w; k < races.length * N; k += 4) {
      const race = races[k % races.length];
      const p = await b.newPage(); await p.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ body: '' }));
      await p.addInitScript(f => { try { localStorage.setItem('bb-replays', '0'); } catch (e) {} window.__flags = f; }, FLAGS);
      await p.goto('http://localhost:8765/index.html?simtest');
      await p.evaluate(race => {
        if (window.__flags) AIX.flags = [window.__flags.split(','), window.__flags.split(',')];
        window.FO = { rows: [], chances: 0, turns: 0 }; let cur = null;
        const LINE = /Lineman|Linemen|Retainer|Clanrat|Marauder|Rotter|Squire|Hopeful|Thrall|Zombie|Skeleton|Snotling|Gnoblar|Goblin Lineman|Beastman|Gnome Lineman|Halfling Hopeful|Lineelf|Lineorc/i;
        const onP = q => q && !q.isReserve && !q.isKO && !q.isCasualty && !q.isEjected && q.x >= 0 && q.x < CFG.cols;
        const L = window.log; window.log = function (m) { try { if (cur && typeof m === 'string') { if (/Armor broken|Armor Roll:.*=/.test(m)) { const mm = m.match(/= (\d+) vs AV(\d+)/); if (mm) cur.broke = +mm[1] >= +mm[2]; } if (/KO'd/.test(m)) cur.inj = 'KO'; { const am = m.match(/FOULS .*\((\d+) assist/); if (am) cur.ast = +am[1]; } if (/CASUALTY|Casualty roll/.test(m)) cur.inj = 'CAS'; if (/Stunned/.test(m) && !cur.inj) cur.inj = 'stun'; if (/SENT OFF|ejected/i.test(m)) cur.off = true; if (/spotted/.test(m)) cur.spotted = true; } } catch (e) {} return L.apply(this, arguments); };
        const F = window.foulCore; window.foulCore = function (a, d) { try { const A = getPlayerById(a), D = getPlayerById(d);
          cur = { race, fouler: A.type, fLine: LINE.test(A.type) || !A.skills.length, victim: D.type, vLine: LINE.test(D.type), vSkills: D.skills.length, turn: state.turn[A.team], broke: false, inj: null, off: false };
          FO.rows.push(cur); } catch (e) {} return F.apply(this, arguments); };
        const E = window.endTeamTurn; window.endTeamTurn = function () { try { const t = state.activeTeam; if (!state.charge) { FO.turns++;
          const down = state.players.filter(q => q.team !== t && onP(q) && (q.isDown || q.isStunned));
          if (down.length && !state.foulUsed) FO.chances++; } } catch (e) {} cur = null; return E.apply(this, arguments); };
        AI.set(0, true); AI.set(1, true); window.launchMatch(race, race, { replaceOk: true });
      }, race);
      const t0 = Date.now(); let clicked = false;
      while (Date.now() - t0 < 150000) { await p.waitForTimeout(250); if (!clicked) clicked = await p.evaluate(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && b.offsetParent) { b.click(); return true; } return false; }); if (await p.evaluate(() => !!state.isGameOver)) break; }
      const r = await p.evaluate(() => FO); out.push(...r.rows); chances += r.chances; turns += r.turns; await p.close();
    }
  }));
  await b.close();
  const m = races.length * N, n = out.length, c = f => out.filter(f).length;
  console.log(`matches ${m}: fouls ${n} (${(n / m / 2).toFixed(2)} a team a match); team turns ${turns}, turns ending with an opponent down and no foul made ${chances}`);
  console.log(`  victims: positionals ${c(r => !r.vLine)}, linemen ${c(r => r.vLine)}; foulers with no skills/linemen ${c(r => r.fLine)}`);
  console.log(`  armour broken ${c(r => r.broke)}, KO ${c(r => r.inj === 'KO')}, casualty ${c(r => r.inj === 'CAS')}, sent off ${c(r => r.off)}`);
  console.log('  assists: ' + [0,1,2,3].map(a => a + ':' + c(r => (r.ast || 0) === a)).join(' '));
  console.log(`  by turn: ` + [1,2,3,4,5,6,7,8].map(t => `${t}:${c(r => r.turn === t)}`).join(' '));
  const ty = {}; out.forEach(r => ty[r.victim] = (ty[r.victim] || 0) + 1); console.log('  victims by type:', Object.entries(ty).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([a, b]) => `${a} ${b}`).join(', '));
})();
