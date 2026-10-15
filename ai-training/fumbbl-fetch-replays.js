// Download FUMBBL replays as JSON, the same way FUMBBL's own client asks for them (WebSocket to fumbbl.com:22223).
// UNTESTED: cloud sessions can't open WebSockets through their proxy, so run it on a normal computer.
// Same method as FUMBBLPlus/fumbblreplay (github.com/FUMBBLPlus/fumbblreplay), which confirms the message format.
// Its authors ask that nobody mass-downloads replays without first contacting Christer and SzieberthAdam on FUMBBL.
// Needs Node 22+ and the lz-string package:   npm install lz-string
// Usage:  node fetch-replays.js 1950576 1953665 ...      (replay numbers; the match list API gives them as replayId)
// Each replay is saved as replay-<number>.json
const fs = require('fs'), LZ = require('lz-string');
function fetchReplay(gameId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://fumbbl.com:22223/command'); ws.binaryType = 'arraybuffer';
    const cmds = []; let prev = null; const timer = setTimeout(() => { ws.close(); reject(new Error('timed out')); }, 120000);
    ws.onopen = () => ws.send(Buffer.from(LZ.compressToUTF16(JSON.stringify({ netCommandId: 'clientReplay', gameId, replayToCommandNr: 0, coach: null })), 'utf8'));
    ws.onmessage = ev => {
      const text = typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8');
      let m; try { m = JSON.parse(LZ.decompressFromUTF16(text) || text); } catch (e) { return; }
      if (m.netCommandId !== 'serverReplay') return;
      const done = () => { clearTimeout(timer); try { ws.send(Buffer.from(LZ.compressToUTF16(JSON.stringify({ netCommandId: 'clientCloseSession' })), 'utf8')); } catch (e) {} ws.close(); resolve(cmds); };
      if (text === prev) { done(); return; }   // at the end the server repeats the same message
      prev = text; cmds.push(...(m.commandArray || []));
      if (m.lastCommand) done();
    };
    ws.onerror = e => { clearTimeout(timer); reject(new Error('connection failed')); };
  });
}
(async () => {
  for (const id of process.argv.slice(2).map(Number)) {
    try { const c = await fetchReplay(id); fs.writeFileSync(`replay-${id}.json`, JSON.stringify(c)); console.log(`replay ${id}: ${c.length} steps saved`); }
    catch (e) { console.log(`replay ${id}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 10000));   // be gentle with FUMBBL's server (fumbblreplay waits 5-20s)
  }
})();
