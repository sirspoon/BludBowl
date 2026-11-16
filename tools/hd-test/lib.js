// Helpers for the HD sprite test: read the palette and sprites out of index.html, paint grids and write PNGs (no dependencies).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const HTML = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
function grabObj(name) {   // the object literal assigned to `const NAME = {...}` (balanced braces, strings skipped)
  const i = HTML.indexOf('const ' + name + ' = {'); if (i < 0) throw new Error(name);
  let j = HTML.indexOf('{', i), d = 0, q = null;
  for (let k = j; k < HTML.length; k++) { const c = HTML[k];
    if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c; else if (c === '{') d++; else if (c === '}' && --d === 0) return eval('(' + HTML.slice(j, k + 1) + ')'); }
}
const FIXED = grabObj('SPRITE_FIXED');
const hexMix = (hex, f, toward) => '#' + [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16); return Math.round(toward == null ? v * f : v + (toward - v) * f).toString(16).padStart(2, '0'); }).join('');
function palette(kit, trim, extra) {
  return Object.assign({}, FIXED, extra || {}, { k: kit, K: hexMix(kit, 0.45, 255), d: hexMix(kit, 0.78), t: trim, T: hexMix(trim, 0.68), l: hexMix(trim, 0.45, 255),
    '(': hexMix(kit, 0.55), ')': hexMix(kit, 0.2, 255), '[': hexMix(trim, 0.45), ']': hexMix(trim, 0.85) });
}
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// images are {w, h, px: Uint8Array RGBA}
function img(w, h, bg) { const px = new Uint8Array(w * h * 4); if (bg) { const c = rgb(bg); for (let i = 0; i < w * h; i++) px.set([...c, 255], i * 4); } return { w, h, px }; }
function blitGrid(im, grid, pal, x0, y0, scale) {   // nearest-neighbour, scale may be fractional
  const gh = grid.length, gw = grid[0].length, W = Math.round(gw * scale), H = Math.round(gh * scale);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = grid[Math.floor(y / scale)][Math.floor(x / scale)], col = pal[ch]; if (!col) continue;
    const X = x0 + x, Y = y0 + y; if (X < 0 || Y < 0 || X >= im.w || Y >= im.h) continue;
    im.px.set([...rgb(col), 255], (Y * im.w + X) * 4);
  }
}
function png(im, file) {
  const crc = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = ~0; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; }; })();
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((im.w * 4 + 1) * im.h); for (let y = 0; y < im.h; y++) { raw[y * (im.w * 4 + 1)] = 0; Buffer.from(im.px.buffer, y * im.w * 4, im.w * 4).copy(raw, y * (im.w * 4 + 1) + 1); }
  const hdr = Buffer.alloc(13); hdr.writeUInt32BE(im.w, 0); hdr.writeUInt32BE(im.h, 4); hdr[8] = 8; hdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', hdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
module.exports = { HTML, grabObj, FIXED, palette, hexMix, img, blitGrid, png };
