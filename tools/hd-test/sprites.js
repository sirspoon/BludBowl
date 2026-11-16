// The High Elf positions redrawn on a 64x64 grid (run: node sprites.js -> hd-highelf.json). Same colours, silhouettes and
// team identity as the 32x32 sprites in index.html; see README.md.
const { canvas, M } = require('./draw');
const EXTRA = { '$': '#7d5a1e', '~': '#fbe6d0', ':': '#b5876a', '^': '#fff4c8', ';': '#a8904e', '_': '#7fa2ea', '=': '#3c63c2', '/': '#0a1634', '&': '#7a6243', '@': '#3d7bd9', '!': '#ff6a2b', '|': '#b3bccb' };

// shared parts --------------------------------------------------------------
function legs(c, o = {}) {   // bare knees, tall boots with a gold cuff
  [[20, 28], [36, 44]].forEach(([a, b]) => {
    c.rect(a, 50, b - a, 8, M.skin, { k: 0.95 });
    c.rect(a, 57, b - a, 6, M.leather, { k: 0.9 });
    c.rect(a, 57, b - a, 1, M.gold, { k: 0.9 });
    c.rect(a - 1, 62, b - a + 2, 1, ['c']);
  });
}
function skirt(c, mat = M.kit) {   // the kit-coloured tunic skirt between belt and knees, split between the legs
  c.poly([[19, 47], [45, 47], [46, 54], [33.5, 54], [33.5, 52], [30.5, 52], [30.5, 54], [18, 54]], mat, { global: true, k: 0.9 });
  for (let x = 23; x <= 41; x += 6) c.line(x, 49, x - (x < 32 ? 1 : -1), 53, mat[3]);   // pleats
}
function belt(c) {
  c.rect(17, 45, 30, 3, M.gold, { global: true });
  c.rect(29, 44, 6, 5, M.trim, { flat: 0 }); c.rect(30, 45, 4, 3, M.gold, { flat: 1 }); c.set(31, 46, 'G'); c.set(32, 46, 'G');
}
function face(c, o = {}) {
  // face: oval with a pointed chin
  c.poly([[25, 23], [39, 23], [39, 30], [35, 34], [29, 34], [25, 30]], M.skin, { k: 0.95, global: true });
  c.ell(32, 27, 7, 6, M.skin, { k: 0.8 });
  // eyes: white, blue iris, dark lash line above
  [[27, 1], [34, 0]].forEach(([x, f]) => { c.rect(x, 27, 3, 2, ['E'], { flat: 0 }); c.set(x + (f ? 2 : 0), 27, '@'); c.set(x + (f ? 2 : 0), 28, 'e'); c.set(x + 1, 27, '@'); c.set(x + 1, 28, '@');
    c.line(x - (f ? 0 : 0), 26, x + 2, 26, 'e'); });
  c.line(26, 25, 29, 25, o.brow || 'H'); c.line(34, 25, 37, 25, o.brow || 'H');   // brows
  c.line(32, 28, 32, 30, 'S'); c.set(31, 31, 'S');   // nose
  c.line(30, 32, 33, 32, 'D');   // mouth
}
function ears(c) {   // pointed elf ears poking out sideways
  c.poly([[25, 26], [20, 22], [21, 24], [25, 31]], M.skin, { flat: 1 }); c.line(22, 24, 24, 28, 'S');
  c.poly([[39, 26], [44, 22], [43, 24], [39, 31]], M.skin, { flat: 2 }); c.line(42, 24, 40, 28, ':');
}
function hairDown(c, y1 = 40) {   // long fair hair falling either side of the face, in strands
  c.poly([[20, 22], [26, 22], [26, y1 - 6], [23, y1], [19, y1 - 2]], M.hair, { k: 0.95 });
  c.poly([[38, 22], [44, 22], [45, y1 - 2], [41, y1], [38, y1 - 6]], M.hair, { k: 0.95 });
  [21, 23, 40, 42].forEach(x => c.line(x, 25, x + (x < 32 ? -0.5 : 0.5), y1 - 3, x < 32 ? 'H' : ';'));
}
function torsoArmour(c, o = {}) {   // a silver breastplate with a white tabard down the middle and gold edging
  c.poly([[23, 35], [41, 35], [42, 45], [22, 45]], M.steel, { k: 0.95 });
  c.ell(32, 39, 8, 5, M.steel, { k: 0.8, clip: (x, y) => y < 42 });
  if (!o.noTabard) { c.rect(29, 36, 6, 10, M.trim, { k: 0.8 }); c.line(28, 36, 28, 45, 'G'); c.line(35, 36, 35, 45, 'G'); }
  c.line(23, 35, 41, 35, 'g');
}
function pauldron(c, side, mat = M.steel) {   // round shoulder plate with a gold rim
  const cx = side < 0 ? 21 : 43;
  c.ell(cx, 38.5, 4.6, 3.8, mat, { k: 0.85, clip: (x, y) => y <= 41 });
  c.line(cx - 4, 41, cx + 4, 41, 'G'); c.line(cx - 3, 42, cx + 3, 42, mat[3]);
}
function arm(c, side, o = {}) {   // bare arm hanging at the side, a steel bracer, a hand
  const x = side < 0 ? 17 : 42;
  c.rect(x, 41, 5, 5, M.skin, { k: 0.9 });
  c.rect(x - 0.5, 45, 6, 4, M.steel, { k: 0.9 }); c.line(x - 0.5, 45, x + 5, 45, 'g');
  if (!o.noHand) c.ell(x + 2.5, 50.5, 2.8, 2.6, M.skin, { k: 0.8 });
}
function neck(c) { c.rect(29, 33, 6, 3, M.skin, { k: 0.9, bias: -0.3 }); }
function helmet(c, o = {}) {   // the tall elven helm: a pointed dome, a gold brow band, cheek guards
  c.poly([[32, 7], [35, 10], [39, 16], [40, 22], [24, 22], [25, 16], [29, 10]], M.steel, { k: 0.9, global: true });
  c.ell(32, 17.5, 7.6, 6.5, M.steel, { k: 0.85, clip: (x, y) => y < 22 });
  c.line(32, 8, 32, 20, 'm'); c.line(33, 9, 33, 20, 'M');   // centre ridge
  c.line(26, 15, 29, 11, 'E');   // a glint
  c.poly([[23, 21], [41, 21], [41, 24], [23, 24]], M.gold, { global: true, k: 0.9 });
  c.set(32, 22, 'w'); c.set(31, 22, 'Y'); c.set(33, 22, 'G'); c.set(32, 23, '$');   // a gem at the front
  c.poly([[24, 24], [26, 24], [26, 29], [25, 31]], M.steel, { flat: 2 });   // slim cheek guards
  c.poly([[38, 24], [40, 24], [39, 31], [38, 29]], M.steel, { flat: 3 });
}
function crest(c, mat = M.kit) {   // a horsehair plume in the team's colour, sweeping up from the helm's peak
  c.ell(32, 6, 5, 4.5, mat, { k: 0.9 });
  c.poly([[28, 7], [36, 7], [34, 12], [30, 12]], mat, { global: true });
  c.line(31, 3, 31, 10, mat[3]); c.line(34, 4, 33, 10, mat[3]); c.line(29, 5, 29, 8, mat[1]);
}
function finish(c) { c.outline('o'); return c.rows(); }

// positions -----------------------------------------------------------------
function lineman() {
  const c = canvas();
  legs(c); skirt(c); arm(c, -1); arm(c, 1);
  hairDown(c, 40);
  torsoArmour(c); belt(c); pauldron(c, -1); pauldron(c, 1);
  neck(c); ears(c); face(c); helmet(c); crest(c);
  return finish(c);
}


function whiteLion() {   // a lion's pelt worn as a hood, its jaws over the brow and its paws hanging off the shoulders
  const c = canvas();
  legs(c); skirt(c);
  // arms, then the pelt's forelegs hanging down outside them with white claws
  arm(c, -1); arm(c, 1);
  [[13, 1], [47, -1]].forEach(([x, f]) => { c.poly([[x - 1, 37], [x + 5, 37], [x + 4, 51], [x, 51]], M.pelt, { k: 0.9 });
    c.line(x + 1, 40, x + 1, 50, 'A'); [0, 2, 4].forEach(d => c.line(x + d - 0.2, 51, x + d - 0.2, 53, 'w')); });
  // tunic in kit with a trim stripe, gold belt
  c.poly([[23, 35], [41, 35], [42, 45], [22, 45]], M.kit, { k: 0.95 });
  c.rect(30, 36, 4, 10, M.trim, { k: 0.8 });
  belt(c);
  // shoulders: the pelt draped over them
  [[20.5, 1], [43.5, -1]].forEach(([cx]) => c.ell(cx, 38, 6, 4.5, M.pelt, { k: 0.85, clip: (x, y) => y <= 42 }));
  // the hood: mane round the head, falling to the shoulders
  c.poly([[17, 12], [47, 12], [48, 36], [43, 38], [40, 31], [24, 31], [21, 38], [16, 36]], M.pelt, { k: 0.95, global: true });
  c.ell(32, 14, 15, 12, M.pelt, { k: 0.9 });
  [18, 20, 44, 46].forEach(x => c.line(x, 18, x + (x < 32 ? -0.5 : 0.5), 35, 'A'));   // mane locks
  [[19, 5], [45, 5]].forEach(([x, y]) => { c.ell(x, y, 3.6, 3.4, M.pelt, { k: 0.8 }); c.ell(x, y + 0.5, 1.6, 1.5, ['F'], { flat: 0 }); });   // ears
  neck(c);
  hairDown(c, 34);
  face(c);
  // the lion's face over the brow: pale muzzle, amber eyes, dark nose, upper jaw with fangs over the forehead
  c.ell(32, 11, 10, 8, ['w', 'f', 'f', 'a', 'F'], { k: 0.85 });
  [[26, 1], [36, -1]].forEach(([x]) => { c.rect(x, 8, 3, 2, ['y'], { flat: 0 }); c.set(x + 1, 8, 'e'); c.set(x + 1, 9, 'e'); c.line(x - 1, 7, x + 3, 7, 'A'); });
  c.poly([[29, 12], [35, 12], [33.5, 15], [30.5, 15]], ['e'], { flat: 0 }); c.set(30, 12, 'I');
  c.line(32, 15, 32, 17, 'A'); c.line(28, 17, 31, 16, 'A'); c.line(33, 16, 36, 17, 'A');
  c.rect(24, 19, 16, 2, ['w', 'f'], { flat: 0 }); c.line(24, 21, 39, 21, 'F');
  [25, 28, 35, 38].forEach(x => { c.set(x, 21, 'E'); c.set(x, 22, 'E'); c.set(x, 23, 'W'); });   // fangs
  return finish(c);
}

function dragonPrince() {   // a knight in deep blue armour, a winged dragon helm and spiked pauldrons; team colour in the trim
  const c = canvas(), B = M.blue;
  // armoured legs
  [[20, 28], [36, 44]].forEach(([a, b]) => { c.rect(a, 50, b - a, 12, B, { k: 0.95 }); c.rect(a, 54, b - a, 2, ['k', 'd'], { flat: 0 }); c.rect(a - 1, 61, b - a + 2, 2, ['N'], { flat: 0 }); c.line(a + 2, 57, a + 2, 60, '_'); });
  // plated skirt
  c.poly([[19, 46], [45, 46], [46, 53], [34, 53], [34, 51], [30, 51], [30, 53], [18, 53]], B, { global: true });
  [24, 40].forEach(x => c.line(x, 47, x, 52, 'N'));
  // spikes off the shoulders, sweeping out and up
  [[[23, 39], [4, 30], [7, 34]], [[41, 39], [60, 30], [57, 34]]].forEach(([s, t, u]) => { c.poly([s, t, u, [s[0], s[1] + 4]], B, { flat: 2 }); c.line(s[0], s[1], t[0], t[1], '_'); });
  [[[22, 44], [9, 40], [11, 43]], [[42, 44], [55, 40], [53, 43]]].forEach(([s, t, u]) => { c.poly([s, t, u, [s[0], s[1] + 3]], B, { flat: 3 }); });
  // arms in plate, gauntlets
  [[16, 1], [43, -1]].forEach(([x]) => { c.rect(x, 41, 5, 9, B, { k: 0.9 }); c.ell(x + 2.5, 50.5, 3, 2.6, ['=', 'n', 'N'], { k: 0.8 }); });
  // breastplate: scale pattern in the kit colour
  c.poly([[22, 34], [42, 34], [43, 46], [21, 46]], B, { k: 0.95 });
  c.ell(32, 39, 9, 5, B, { k: 0.8, clip: (x, y) => y < 42 });
  for (let y = 37; y <= 43; y += 3) for (let x = 26 + (y % 2) * 2; x <= 37; x += 4) { c.set(x, y, 'k'); c.set(x + 1, y, 'k'); c.set(x, y + 1, 'd'); }
  c.rect(21, 45, 22, 2, ['K', 'k', 'd'], { global: true }); c.rect(30, 44, 4, 4, M.gold, { flat: 1 });   // kit belt, gold buckle
  [[20.5], [43.5]].forEach(([cx]) => { c.ell(cx, 37.5, 5.5, 4.5, B, { k: 0.85, clip: (x, y) => y <= 41 }); c.line(cx - 5, 41, cx + 5, 41, 'k'); });
  // the helm: a tall central fin, blade-like wings, a T-shaped face opening
  c.poly([[32, 0], [35, 4], [36, 20], [28, 20], [29, 4]], B, { global: true });
  c.line(32, 1, 32, 19, '_'); c.line(33, 2, 33, 19, 'N');
  [[[27, 18], [9, 4], [12, 4], [28, 14]], [[37, 18], [55, 4], [52, 4], [36, 14]]].forEach(pts => { c.poly(pts, B, { flat: pts[0][0] < 32 ? 1 : 3 }); c.line(pts[0][0], pts[0][1] - 2, pts[1][0] + 1, pts[1][1] + 1, pts[0][0] < 32 ? '_' : '='); });
  [[[24, 26], [12, 20], [14, 23], [24, 30]], [[40, 26], [52, 20], [50, 23], [40, 30]]].forEach(pts => c.poly(pts, B, { flat: pts[0][0] < 32 ? 2 : 3 }));
  c.ell(32, 25, 10, 10, B, { k: 0.85 });
  c.poly([[22, 25], [42, 25], [41, 34], [23, 34]], B, { global: true });
  c.rect(23, 21, 18, 2, ['k', 'k', 'd'], { global: true });   // kit band round the brow
  // face opening: eyes band and a narrow slot, the elf's face in shadow behind
  c.rect(26, 25, 12, 3, ['S'], { flat: 0 }); c.rect(30, 28, 4, 5, ['S'], { flat: 0 });
  c.rect(27, 25, 3, 1, ['e'], { flat: 0 }); c.rect(34, 25, 3, 1, ['e'], { flat: 0 }); c.set(28, 26, '@'); c.set(35, 26, '@'); c.line(31, 29, 31, 31, ':');
  c.line(26, 28, 29, 28, '/'); c.line(34, 28, 37, 28, '/');
  return finish(c);
}

function phoenixWarrior() {   // the thrower: flame-plumed helm, ball held up high, a cloak in the team colour
  const c = canvas();
  legs(c);
  // cloak over the left shoulder, flowing out behind
  c.poly([[24, 34], [18, 35], [11, 44], [8, 54], [12, 56], [18, 53], [22, 46]], M.kit, { k: 0.95, global: true });
  c.line(14, 44, 11, 54, 'd'); c.line(18, 42, 16, 52, '('); c.line(19, 38, 12, 47, ')');
  skirt(c);
  arm(c, -1);
  // raised throwing arm and the ball
  c.poly([[41, 36], [46, 34], [52, 20], [48, 19]], M.skin, { flat: 1 }); c.line(47, 33, 52, 21, 'S');
  c.poly([[48, 26], [52, 27], [53, 23], [49, 22]], M.steel, { flat: 2 }); c.line(48, 26, 52, 27, 'g');
  c.ell(51, 13, 6, 4.6, M.leather, { k: 0.8 }); c.line(47, 13, 55, 13, 'w'); [49, 51, 53].forEach(x => c.line(x, 12, x, 14, 'w'));   // ball, laces
  c.ell(50, 18.5, 2.6, 2.2, M.skin, { k: 0.8 });
  hairDown(c, 40);
  // scale-mail torso with gold, tabard
  c.poly([[23, 35], [41, 35], [42, 45], [22, 45]], M.steel, { k: 0.95 });
  for (let y = 36; y <= 44; y += 2) for (let x = 23 + (y % 4 ? 1 : 0); x <= 40; x += 3) c.set(x, y, y < 40 ? 'g' : 'G');
  c.rect(29, 36, 6, 10, M.trim, { k: 0.8 }); c.line(28, 36, 28, 45, 'G'); c.line(35, 36, 35, 45, 'G');
  belt(c); pauldron(c, -1); pauldron(c, 1);
  neck(c); ears(c); face(c); helmet(c);
  // flames: a plume on top and wings of fire off the helm's sides
  c.poly([[24, 19], [14, 9], [16, 8], [20, 10], [17, 5], [22, 9], [26, 15]], M.fire, { global: true, k: 0.95 });
  c.poly([[40, 19], [50, 9], [48, 8], [44, 10], [47, 5], [42, 9], [38, 15]], M.fire, { global: true, k: 0.95 });
  c.ell(32, 6, 5, 4, ['Y', 'y', 'y', 'r'], { k: 0.9 });
  c.poly([[27, 6], [29, 0], [31, 4], [33, -1], [35, 4], [37, 1], [37, 7]], ['Y', 'y', 'r'], { global: true });
  c.ell(32, 7, 2.5, 2, ['w', 'Y'], { k: 0.6 }); c.rect(29, 9, 6, 3, ['y', 'r', 'R'], { global: true });
  return finish(c);
}

const OUT = { Lineman: lineman(), 'White Lion': whiteLion(), 'Dragon Prince': dragonPrince(), 'Phoenix Warrior': phoenixWarrior() };
if (require.main === module) {
  require('fs').writeFileSync(__dirname + '/hd-highelf.json', JSON.stringify(OUT));
  const L = require('./lib'), old = L.grabObj('SPRITES').highelf, pal = L.palette('#1e3a8a', '#ffffff', EXTRA), pal2 = L.palette('#b91c1c', '#facc15', EXTRA);
  const names = Object.keys(old), W = 272, im = L.img(names.length * W, W * 2 + 120, '#2f5a2f');
  names.forEach((n, i) => { L.blitGrid(im, old[n], pal, i * W + 8, 8, 8); if (OUT[n]) L.blitGrid(im, OUT[n], pal, i * W + 8, W, 4);
    // actual size-ish (40px), both kits, old then new
    L.blitGrid(im, old[n], pal, i * W + 8, W * 2 + 20, 1.25); if (OUT[n]) L.blitGrid(im, OUT[n], pal, i * W + 60, W * 2 + 20, 0.625);
    L.blitGrid(im, old[n], pal2, i * W + 120, W * 2 + 20, 1.25); if (OUT[n]) L.blitGrid(im, OUT[n], pal2, i * W + 170, W * 2 + 20, 0.625);
    L.blitGrid(im, old[n], pal, i * W + 8, W * 2 + 66, 1.5); if (OUT[n]) L.blitGrid(im, OUT[n], pal, i * W + 60, W * 2 + 66, 0.75); });
  L.png(im, process.argv[2] || __dirname + '/shots/sheet-old-v-new.png');
}
module.exports = { OUT, EXTRA };
