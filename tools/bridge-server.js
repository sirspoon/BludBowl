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
  const B = w.eval('AI.bridge');
  const out = o => process.stdout.write(JSON.stringify(o) + '\n');
  out({ ready: true });
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', line => {
    if (!line.trim()) return;
    let q; try { q = JSON.parse(line); } catch (e) { out({ ok: false, error: 'bad JSON' }); return; }
    try {
      const t0 = TIMING ? performance.now() : 0;
      if (q.desc) B.load(q.desc);
      const t1 = TIMING ? performance.now() : 0;
      if (TIMING) { TIMES.load += t1 - t0; TIMES.n++; TIMES.t1 = t1; }
      const fn = q.op && q.op !== 'load' ? B[q.op] : null;
      if (q.op && q.op !== 'load' && typeof fn !== 'function') throw new Error('unknown op ' + q.op);
      if (q.record && fn) {   // (ai-training/nn: the answer, plus each decision as the neural network sees it, labelled with the answer)
        const rec = B.nnRecord(q.op, q.arg);
        out({ ok: true, result: rec.result == null ? null : JSON.parse(JSON.stringify(rec.result)), nn: rec.samples });
        return;
      }
      const r = fn ? fn(q.arg) : null;
      if (TIMING) { const d = performance.now() - TIMES.t1; TIMES.op += d; const k = q.op || 'none'; TIMES.by[k] = TIMES.by[k] || [0, 0, 0]; TIMES.by[k][0]++; TIMES.by[k][1] += d; TIMES.by[k][2] += line.length; }
      const t2 = TIMING ? performance.now() : 0;
      out({ ok: true, result: r == null ? null : JSON.parse(JSON.stringify(r)) });
      if (TIMING) TIMES.out += performance.now() - t2;
    } catch (e) { out({ ok: false, error: String(e && e.stack || e).slice(0, 600) }); }
  });
  const report = () => { if (!TIMING || !TIMES.n) return; process.stderr.write(`bridge timing: ${TIMES.n} questions; load ${(TIMES.load / TIMES.n).toFixed(1)} ms, answer ${(TIMES.op / TIMES.n).toFixed(1)} ms, send back ${(TIMES.out / TIMES.n).toFixed(1)} ms each; by kind: ` +
    Object.entries(TIMES.by).map(([k, v]) => `${k} ${v[0]} x ${(v[1] / v[0]).toFixed(1)} ms (${Math.round(v[2] / v[0] / 1024)} KB in)`).join(', ') + '\n'); };
  rl.on('close', () => { report(); process.exit(0); }); process.stdin.on('end', () => { report(); process.exit(0); });
})();
