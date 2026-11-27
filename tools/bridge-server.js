// BludBowl's AI as a service, for other programs (BotBowl's Python bot: tools/botbowl/bludbowl_bot.py; ai-training/botbowl-bridge.md).
// Opens the game with no browser (tools/headless-match.js), then answers one question per line on stdin, one JSON line back on stdout:
//   {"op": "turn" | "reroll" | "dice" | "push" | "follow" | "setup" | "kick" | "touchback", "desc": {...position...}, "arg": ...}
//   -> {"ok": true, "result": ...}   or   {"ok": false, "error": "..."}
// desc (optional) loads a position first: see the bridge in index.html (AI.bridge.load) for its fields. Prints {"ready": true} when set.
// Needs jsdom: npm i jsdom
const readline = require('readline');
const TIMING = !!process.env.BRIDGE_TIMING, TIMES = { load: 0, op: 0, out: 0, n: 0, t1: 0, by: {} };   // (BRIDGE_TIMING=1: average times per question on stderr)
const { openGame } = require('./headless-match');

(async () => {
  const { window: w } = await openGame({ simtest: false });   // (the normal clock: test mode's runs flat out even when idle)
  // a Human v Human match, with nobody playing it: only there to give the AI its teams and a game to put positions into
  w.eval(`AI.set(0, false); AI.set(1, false); window.launchMatch('human', 'human', { replaceOk: true });`);
  // BRIDGE_AIP='{"deepN":0}': tuning values for the AI on both sides (window.AIP), e.g. to test a feature off (nn/evaluate.py --aip)
  if (process.env.BRIDGE_AIP) { const aip = JSON.parse(process.env.BRIDGE_AIP); w.AIP = [aip, aip]; }
  await new Promise(r => setTimeout(r, 1500));
  // nobody sees this game: stop the page's repeating chores (its setInterval ids are 'iv1', 'iv2', ...: autosave every 0.7 s, repaints, and the
  // pitch-texture check, which in jsdom never finds a drawn pitch and rebuilds it every 5 s - ~13% of a BotBowl game's time v drefsante). The
  // answers don't change: every question is answered synchronously, with Math.random re-seeded from its text first.
  const lastIv = +String(w.setInterval(() => {}, 1e9)).slice(2);
  for (let i = 1; i <= lastIv; i++) w.clearInterval('iv' + i);
  w.pitchTexCheck = () => {};
  const B = w.eval('AI.bridge');
  const out = o => process.stdout.write(JSON.stringify(o) + '\n');
  // the AI's Math.random is seeded from each question (its text without the id), so the same position always gets the same answer and a
  // BotBowl game is repeatable from its seed: two AI versions then play identical games until their choices differ (nn/evaluate.py pairs them
  // by seed). BRIDGE_RANDOM=1: unseeded, as before.
  let rs = 1;
  const rnd = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const seedFrom = s => { if (process.env.BRIDGE_RANDOM) return; let h = 0x811C9DC5; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193); rs = h | 0; };
  if (!process.env.BRIDGE_RANDOM) w.Math.random = rnd;
  out({ ready: true });
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });   // (CR LF is always one line end)
  rl.on('line', line => {
    if (!line.trim()) return;
    // a question may carry "id" (last, so it can usually be found even in a line that can't be read): its answer echoes it
    let q; try { q = JSON.parse(line); } catch (e) {
      const m = /"id": ?(\d+)\}\s*$/.exec(line), id = m ? +m[1] : undefined;
      process.stderr.write(`bridge: could not read question ${id} (${line.length} chars, ${e.message}): ${JSON.stringify(line.slice(0, 120))} ... ${JSON.stringify(line.slice(-120))}\n`);
      out({ ok: false, error: 'bad JSON', id }); return;
    }
    const say = o => out(q.id === undefined ? o : Object.assign(o, { id: q.id }));
    seedFrom(line.replace(/,? ?"id": ?\d+\}\s*$/, '}'));
    try {
      const t0 = TIMING ? performance.now() : 0;
      if (q.desc) B.load(q.desc);
      const t1 = TIMING ? performance.now() : 0;
      if (TIMING) { TIMES.load += t1 - t0; TIMES.n++; TIMES.t1 = t1; }
      const fn = q.op && q.op !== 'load' ? B[q.op] : null;
      if (q.op && q.op !== 'load' && typeof fn !== 'function') throw new Error('unknown op ' + q.op);
      if (q.record && fn) {   // (ai-training/nn: the answer, plus each decision as the neural network sees it, labelled with the answer)
        const rec = B.nnRecord(q.op, q.arg);
        say({ ok: true, result: rec.result == null ? null : JSON.parse(JSON.stringify(rec.result)), nn: rec.samples });
        return;
      }
      const r = fn ? fn(q.arg) : null;
      if (TIMING) { const d = performance.now() - TIMES.t1; TIMES.op += d; const k = q.op || 'none'; TIMES.by[k] = TIMES.by[k] || [0, 0, 0]; TIMES.by[k][0]++; TIMES.by[k][1] += d; TIMES.by[k][2] += line.length; }
      const t2 = TIMING ? performance.now() : 0;
      say({ ok: true, result: r == null ? null : JSON.parse(JSON.stringify(r)) });
      if (TIMING) TIMES.out += performance.now() - t2;
    } catch (e) { say({ ok: false, error: String(e && e.stack || e).slice(0, 600) }); }
  });
  const report = () => { if (!TIMING || !TIMES.n) return; process.stderr.write(`bridge timing: ${TIMES.n} questions; load ${(TIMES.load / TIMES.n).toFixed(1)} ms, answer ${(TIMES.op / TIMES.n).toFixed(1)} ms, send back ${(TIMES.out / TIMES.n).toFixed(1)} ms each; by kind: ` +
    Object.entries(TIMES.by).map(([k, v]) => `${k} ${v[0]} x ${(v[1] / v[0]).toFixed(1)} ms (${Math.round(v[2] / v[0] / 1024)} KB in)`).join(', ') + '\n'); };
  // (BRIDGE_COUNTS=file: on closing, append the AI's own counters - brain x's AIX.count tallies, per team - to that file as one JSON line)
  const counts = () => { const f = process.env.BRIDGE_COUNTS; if (!f) return; try { require('fs').appendFileSync(f, w.eval('JSON.stringify(AIX.st)') + '\n'); } catch (e) { process.stderr.write('bridge counts: ' + e.message + '\n'); } };
  rl.on('close', () => { report(); counts(); process.exit(0); }); process.stdin.on('end', () => { report(); counts(); process.exit(0); });
})();
