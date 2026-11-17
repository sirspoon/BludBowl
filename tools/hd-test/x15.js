// The original 32x32 High Elf sprites at 1.5x (48x48), keeping their character: Scale3x (sharp, smooths diagonals) to 96x96,
// then each 2x2 block becomes its most common letter (outline wins ties, so outlines stay unbroken). Run: node tools/hd-test/x15.js
const L = require('./lib');
function scale3x(g) {
  const h = g.length, w = g[0].length, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? g[Math.min(h - 1, Math.max(0, y))][Math.min(w - 1, Math.max(0, x))] : g[y][x];
  const out = Array.from({ length: h * 3 }, () => Array(w * 3).fill('.'));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const A = at(x - 1, y - 1), B = at(x, y - 1), C = at(x + 1, y - 1), D = at(x - 1, y), E = at(x, y), F = at(x + 1, y), G = at(x - 1, y + 1), H = at(x, y + 1), I = at(x + 1, y + 1);
    let r = [E, E, E, E, E, E, E, E, E];
    if (B !== H && D !== F) {
      r = [D === B ? D : E, (D === B && E !== C) || (B === F && E !== A) ? B : E, B === F ? F : E,
        (D === B && E !== G) || (D === H && E !== A) ? D : E, E, (B === F && E !== I) || (H === F && E !== C) ? F : E,
        D === H ? D : E, (D === H && E !== I) || (H === F && E !== G) ? H : E, H === F ? F : E];
    }
    for (let k = 0; k < 9; k++) out[y * 3 + Math.floor(k / 3)][x * 3 + k % 3] = r[k];
  }
  return out;
}
function down2(g) {
  const n = g.length / 2, out = [];
  for (let y = 0; y < n; y++) { let row = '';
    for (let x = 0; x < n; x++) {
      const b = [g[2 * y][2 * x], g[2 * y][2 * x + 1], g[2 * y + 1][2 * x], g[2 * y + 1][2 * x + 1]], cnt = {};
      b.forEach(c => cnt[c] = (cnt[c] || 0) + 1);
      let best = null; for (const [c, k] of Object.entries(cnt)) { const sc = k * 10 + (c === 'o' ? -2 : c === '.' ? -1 : 0); if (!best || sc > best[1]) best = [c, sc]; }
      row += best[0];
    }
    out.push(row);
  }
  return out;
}
function outline(g) {   // a clean 1-pixel dark outline round the figure
  const h = g.length, w = g[0].length, a = g.map(r => [...r]), filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && g[y][x] !== '.' && g[y][x] !== 'o';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) a[y][x] = 'o';
  return a.map(r => r.join(''));
}
// light from the upper left: each colour's edge pixel next to the outline (or a darker part) goes a shade lighter on its left,
// a shade darker on its right, for a little roundness without changing the colours
const LIGHTER = { M: 'm', m: 'E', W: 'm', i: 'M', I: 'i', k: ')', d: 'k', '(': 'd', s: '~', S: 's', h: '^', H: 'h', n: '=', N: 'n', g: 'Y', G: 'g', f: 'w', F: 'f', A: 'a', a: 'f', r: 'y', R: 'r', c: 'b', B: 'b', t: 'l', T: 't' };
const DARKER = { m: 'M', W: 'M', M: 'i', i: 'I', K: 'k', k: 'd', d: '(', s: 'S', S: ':', h: 'H', H: ';', n: 'N', N: '/', g: 'G', G: '$', f: 'F', F: 'A', a: 'F', A: '&', y: 'r', r: 'R', c: 'X', b: 'B', l: 't', t: 'T', w: 'f' };
function rim(g) {
  const h = g.length, w = g[0].length, a = g.map(r => [...r]), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? '.' : g[y][x];
  const edge = c => c === 'o' || c === '.';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = g[y][x]; if (edge(c)) continue;
    if (edge(at(x + 1, y)) && DARKER[c]) a[y][x] = DARKER[c];
    else if ((edge(at(x - 1, y)) || edge(at(x, y - 1))) && LIGHTER[c] && !edge(at(x + 1, y))) a[y][x] = LIGHTER[c];
  }
  return a.map(r => r.join(''));
}
// faces: an eye white beside skin gets a blue iris next to it (where the original had a dark pupil) and a brow above
function eyes(g) {
  const a = g.map(r => [...r]), at = (x, y) => (g[y] || '')[x];
  for (let y = 1; y < g.length; y++) for (let x = 1; x < g[0].length - 1; x++) if (g[y][x] === 'e' && (at(x - 1, y) === 'E' || at(x + 1, y) === 'E') && /[sS]/.test(at(x, y + 1) || '')) {
    a[y][x] = '@'; for (const dx of [-1, 0, 1]) if (/[sS~]/.test(at(x + dx, y - 1) || '')) a[y - 1][x + dx] = 'H';
  }
  return a.map(r => r.join(''));
}
// every original pixel's colour must still show in the 1.5x1.5 patch it became (small details like eyes, fangs and gems
// can lose the 2x2 vote): if it's missing, put it back in the middle of the patch
function keepDetails(src, g) {
  const a = g.map(r => [...r]);
  for (let y = 0; y < src.length; y++) for (let x = 0; x < src[0].length; x++) {
    const c = src[y][x]; if (c === '.') continue;
    const x0 = Math.floor(x * 1.5), x1 = Math.floor(x * 1.5 + 1.49), y0 = Math.floor(y * 1.5), y1 = Math.floor(y * 1.5 + 1.49);
    let found = false; for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) if (a[yy][xx] === c) found = true;
    if (!found) a[Math.round(y * 1.5 + 0.25)][Math.round(x * 1.5 + 0.25)] = c;
  }
  return a.map(r => r.join(''));
}
const to48 = grid => eyes(rim(outline(keepDetails(grid, down2(scale3x(grid))))));
const old = L.grabObj('SPRITES').highelf;
const OUT = {}; for (const [k, v] of Object.entries(old)) OUT[k] = to48(v);
module.exports = { OUT, to48, scale3x, down2, outline };
if (require.main === module) {
  require('fs').writeFileSync(__dirname + '/x15-highelf.json', JSON.stringify(OUT));
  const pal = L.palette('#1e3a8a', '#ffffff', require('./sprites').EXTRA), names = Object.keys(old), im = L.img(names.length * 400, 420, '#2f5a2f');
  names.forEach((n, i) => { L.blitGrid(im, old[n], pal, i * 400 + 4, 4, 6); L.blitGrid(im, OUT[n], pal, i * 400 + 200, 4, 4);
    L.blitGrid(im, old[n], pal, i * 400 + 20, 220, 1.25); L.blitGrid(im, OUT[n], pal, i * 400 + 80, 220, 40 / 48); });
  L.png(im, process.argv[2] || '/tmp/claude-0/-home-user-BludBowl/c32b7443-cdeb-5828-b03a-b399f4b1cf03/scratchpad/x15a.png');
}
