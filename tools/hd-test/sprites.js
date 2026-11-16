// The High Elf positions redrawn on a 64x64 grid (run: node sprites.js -> hd-highelf.json). Drawn after GW's 2026 High Elf
// team (the Caledor Dragons) so each position reads at a glance: Linemen in silver with a team-colour crest, White Lions under
// a tawny lion pelt in a wide crouch with a clawed arm flung out, Phoenix Warriors in a tall gold winged helm and gold scale
// coat with the ball raised, Dragon Princes in blue dragon-winged armour. Every helm has a red gem on the brow. See README.md.
const { canvas, M } = require('./draw');
const EXTRA = { '$': '#7d5a1e', '~': '#fbe6d0', ':': '#b5876a', '^': '#fff4c8', ';': '#a8904e', '_': '#7fa2ea', '=': '#3c63c2', '/': '#0a1634',
  '&': '#7a6243', '@': '#3d7bd9', '!': '#ff6a2b', '|': '#b3bccb', '<': '#f2cf86', '>': '#d9a95a', '?': '#a8763a', '{': '#6e4a22' };

// shared parts --------------------------------------------------------------
function gem(c, x, y, r = 1.6) {   // a red gem in a gold setting
  c.ell(x, y, r + 1, r + 1, M.phx, { k: 0.8 }); c.ell(x, y, r, r, M.gem, { k: 0.8 }); c.set(x - 1, y - 1, 'j');
}
function face(c, y = 24, o = {}) {   // a narrow elf face in the helm's opening: eyes, nose, a set mouth
  c.poly([[26, y], [38, y], [38, y + 6], [35, y + 10], [29, y + 10], [26, y + 6]], M.skin, { k: 0.95, global: true });
  c.line(27, y + 1, 30, y + 2, 'e'); c.line(37, y + 1, 34, y + 2, 'e');   // brows down: determined
  c.set(28, y + 3, 'E'); c.set(29, y + 3, '@'); c.set(35, y + 3, '@'); c.set(36, y + 3, 'E');
  c.line(32, y + 3, 32, y + 6, 'S'); c.set(31, y + 6, ':');
  c.line(30, y + 8, 34, y + 8, 'D');
}
function socksBoots(c, a, b, top = 54) {   // bare thigh, white sock with a kit stripe, dark laced boot
  c.rect(a, top - 3, b - a, 4, M.skin, { k: 0.95 });
  c.rect(a, top, b - a, 4, ['w', 'W', 'W', '|'], { k: 0.9 }); c.rect(a, top + 1, b - a, 1, M.kit, { k: 0.9 });
  c.rect(a, top + 4, b - a, 5, ['c', 'c', 'X'], { k: 0.9 }); for (let y = top + 5; y < top + 9; y += 2) c.line(a + 2, y, b - 3, y, 'A');
  c.rect(a - 1, top + 8, b - a + 2, 1, ['X']);
}
function greave(c, a, b, top = 52) {   // steel greave and sabaton over the shin
  c.rect(a, top - 2, b - a, 3, M.skin, { k: 0.95 });
  c.poly([[a - 1, top], [b + 1, top], [b, top + 9], [a, top + 9]], M.steel, { k: 0.9 }); c.line(a, top, b, top, 'E');
  c.rect(a - 1, top + 9, b - a + 2, 2, ['M', 'i'], { flat: 0 });
}
function tassets(c, y0 = 47, y1 = 53, x0 = 19, x1 = 45) {   // dark scale armour over the kit tunic, kit edging at the bottom
  c.poly([[x0 + 1, y0], [x1 - 1, y0], [x1, y1], [x0, y1]], M.kit, { global: true });
  for (let y = y0; y < y1 - 1; y += 2) for (let x = x0 + 1 + (y % 4 ? 1 : 0); x < x1 - 1; x += 3) { c.set(x, y, 'M'); c.set(x + 1, y, 'i'); c.set(x, y + 1, 'I'); c.set(x + 1, y + 1, 'I'); }
  c.line(x0, y1 - 1, x1 - 1, y1 - 1, 'K'); c.rect(30, y0, 4, y1 - y0, M.kit, { global: true });   // a kit panel down the front
}
function sashBelt(c, y = 45) {   // white sash belt with a red gem buckle
  c.rect(21, y, 22, 3, M.trim, { k: 0.85, global: true }); gem(c, 32, y + 1.5, 1.4);
}
function breastplate(c, o = {}) {   // silver, a white sun disc in the middle
  c.poly([[22, 34], [42, 34], [42, 46], [22, 46]], M.steel, { k: 0.95 });
  c.ell(32, 38.5, 9, 4.5, M.steel, { k: 0.8, clip: (x, y) => y < 41 });
  if (!o.noSun) { c.ell(32, 39, 3.2, 3, ['w', 't', ']'], { k: 0.7 }); c.set(32, 39, 'G'); c.set(31, 39, 'g'); }
}
function pauldron(c, side, mat = M.steel) {   // angular flared shoulder plate with a kit edge
  const s = side < 0 ? -1 : 1, x0 = 32 + s * 9, x1 = 32 + s * 19;
  c.poly([[x0, 33], [x1 - s * 2, 34], [x1, 38], [x1 - s, 41], [x0, 40]], mat, { global: true, k: 0.9 });
  c.line(x1 - s * 1, 38, x1 - s * 1, 41, 'k'); c.line(x0, 40, x1 - s, 41, 'k');
}
function armDown(c, side, o = {}) {   // kit sleeve, steel bracer, fist held a little out from the body
  const s = side, sx = 32 + s * 13, ex = 32 + s * 15, hx = 32 + s * 17;
  c.poly([[sx - 2.5, 40], [sx + 2.5, 40], [ex + 2.5, 46], [ex - 2.5, 46]], o.sleeve || M.kit, { flat: s < 0 ? 1 : 3 });
  c.poly([[ex - 3, 45], [ex + 3, 45], [hx + 2.5, 50], [hx - 2.5, 50]], M.steel, { flat: s < 0 ? 1 : 3 }); c.line(ex - 3, 45, ex + 3, 45, 'G');
  c.ell(hx, 51, 2.8, 2.5, M.skin, { k: 0.8 });
  if (o.claws) [-2, 0, 2].forEach(d => c.line(hx + d, 53, hx + d * 1.4, 56, 'e'));
}
function finish(c) { c.outline('o'); return c.rows(); }

// positions -----------------------------------------------------------------
function lineman() {   // tall silver cone helm, team-colour horsehair crest swept back, white sash across the chest
  const c = canvas();
  socksBoots(c, 19, 27); socksBoots(c, 37, 45);
  tassets(c); armDown(c, -1); armDown(c, 1);
  breastplate(c);
  c.poly([[23, 35], [26, 34], [42, 44], [42, 47], [39, 47]], M.trim, { k: 0.85, global: true });   // the sash, shoulder to hip
  sashBelt(c); pauldron(c, -1); pauldron(c, 1);
  c.rect(28, 31, 8, 4, M.steel, { flat: 2 });   // gorget
  // crest: kit horsehair rising off the helm's point and streaming back
  c.poly([[31, 6], [27, 2], [30, 0], [36, 0], [41, 3], [44, 9], [43, 15], [40, 9], [35, 5]], M.kit, { global: true, k: 0.95 });
  c.line(30, 1, 40, 4, ')'); c.line(35, 2, 43, 12, 'd'); c.line(33, 4, 40, 8, '(');
  // helm: a tall narrow cone, cheek guards, open face
  c.poly([[32, 3], [36, 9], [39, 17], [40, 26], [38, 33], [36, 33], [37, 24], [27, 24], [28, 33], [26, 33], [24, 26], [25, 17], [28, 9]], M.steel, { k: 0.9, global: true });
  c.line(32, 4, 32, 20, 'E'); c.line(33, 6, 33, 20, 'M');
  face(c, 24); gem(c, 32, 20.5);
  c.line(25, 23, 39, 23, 'G');
  return finish(c);
}

function whiteLion() {   // open silver helm, the lion's head worn on his shoulder with its mane down his back, wide crouch, claws out
  const c = canvas(), L = M.lion;
  // claws: long curved hooks in pale bone, each kept apart so the outline shows every one
  const claw = (x, y, dx, dy, hx, hy) => { c.line(x, y, x + dx, y + dy, 'w'); c.line(x + dx, y + dy, x + dx + hx, y + dy + hy, 'W'); };
  // legs in a wide crouch: kit shorts, big steel greaves
  c.poly([[24, 47], [31, 47], [22, 56], [15, 54]], M.kit, { flat: 2 }); c.poly([[33, 47], [40, 47], [49, 54], [42, 56]], M.kit, { flat: 3 });
  c.poly([[15, 53], [22, 55], [21, 62], [12, 62]], M.steel, { k: 0.9, global: true }); c.line(15, 53, 22, 55, 'E');
  c.poly([[42, 55], [49, 53], [52, 62], [43, 62]], M.steel, { k: 0.9, global: true }); c.line(42, 55, 49, 53, 'E');
  c.rect(11, 62, 11, 1, ['i']); c.rect(43, 62, 10, 1, ['i']);
  tassets(c, 44, 50, 21, 43);
  // the flung arm: kit sleeve, then the lion's foreleg worn as a gauntlet, a big paw and four claws reaching up and out
  c.poly([[20, 35], [25, 38], [17, 28], [13, 30]], M.kit, { flat: 1 });
  c.poly([[17, 27], [12, 31], [8, 22], [12, 19]], L, { global: true, k: 0.95 }); c.line(15, 28, 10, 21, '?'); c.line(11, 31, 8, 25, '{');
  c.ell(9, 18, 4.5, 4, L, { k: 0.85 });   // the paw
  claw(5, 16, -2, -3, -1, 1); claw(7, 14, -1, -4, -1, 1); claw(10, 14, 0, -4, 0, 1); claw(13, 15, 1, -3, 1, 1);
  // the other arm low and out, steel bracer, a clawed hand
  c.poly([[42, 38], [46, 38], [50, 45], [46, 46]], M.kit, { flat: 3 }); c.poly([[46, 44], [50, 43], [53, 49], [49, 50]], M.steel, { flat: 3 });
  c.ell(52, 51, 2.8, 2.6, M.skin, { k: 0.8 });
  claw(49, 53, -2, 3, -1, 2); claw(52, 54, 0, 4, 0, 1); claw(55, 53, 2, 3, 1, 2);
  // body: silver plates, white belt with the red gem
  c.poly([[24, 33], [41, 33], [41, 44], [23, 44]], M.steel, { k: 0.95 });
  c.ell(32, 37, 8, 4, M.steel, { k: 0.8, clip: (x, y) => y < 40 });
  c.rect(23, 42, 18, 3, M.trim, { k: 0.85, global: true }); gem(c, 32, 43.5, 1.4);
  pauldron(c, -1);
  // the pelt: mane falling from the lion's head down his right side and over the back
  c.poly([[34, 30], [46, 26], [52, 34], [49, 42], [44, 44], [42, 38], [36, 35]], L, { global: true, k: 0.95 });
  [[44, 32, 47, 42], [41, 33, 44, 42], [48, 31, 50, 39], [38, 33, 41, 38]].forEach(([a, b, x, y]) => c.line(a, b, x, y, '?'));
  // helm: open-faced silver helm, a raised ridge down the middle, cheek guards, the red gem on the brow
  c.ell(30, 18, 8.5, 8, M.steel, { k: 0.85 });
  c.poly([[21.5, 18], [38.5, 18], [38, 29], [35, 33], [25, 33], [22, 29]], M.steel, { global: true });
  c.poly([[29, 7], [31, 7], [32, 20], [28, 20]], ['E', 'm', '|'], { global: true });   // the ridge
  c.line(22, 23, 38, 23, 'G');
  c.poly([[24, 24], [36, 24], [36, 29], [33, 33], [27, 33], [24, 29]], M.skin, { k: 0.95, global: true });   // face
  c.line(25, 25, 28, 26, 'e'); c.line(35, 25, 32, 26, 'e'); c.set(26, 27, 'E'); c.set(27, 27, '@'); c.set(33, 27, '@'); c.set(34, 27, 'E');
  c.line(30, 27, 30, 30, 'S'); c.line(28, 31, 32, 31, 'D');
  c.rect(23, 24, 2, 7, ['M'], { flat: 0 }); c.rect(36, 24, 2, 7, ['i'], { flat: 0 });   // cheek guards
  gem(c, 30, 20.5, 1.5);
  // the lion's head, on his left shoulder: shaggy mane, tawny face looking out, fierce brows, nose, open jaw with fangs
  c.ell(46, 22, 10, 9, ['>', '>', '?', '?', '{'], { k: 0.9 });
  [[38, 15, 39, 10, 43, 13], [43, 13, 46, 8, 49, 13], [49, 13, 54, 10, 54, 16], [54, 18, 59, 18, 55, 23], [55, 25, 58, 29, 52, 29], [37, 21, 34, 19, 37, 25]]
    .forEach(([a, b, x, y, e, f]) => c.poly([[a, b], [x, y], [e, f]], ['>', '?'], { flat: x < 46 ? 0 : 1 }));
  [[40, 16, 38, 22], [52, 16, 54, 22], [42, 13, 41, 17], [50, 13, 51, 17]].forEach(([a, b, x, y]) => c.line(a, b, x, y, '{'));
  c.ell(46, 22, 6.2, 6, L, { k: 0.85 });   // face
  c.ell(46, 25, 4.2, 2.8, ['^', '^', '<', '>'], { k: 0.8 });   // muzzle
  c.line(41, 19, 44, 20, '{'); c.line(51, 19, 48, 20, '{');   // brows down
  c.rect(42, 21, 2, 1, ['y'], { flat: 0 }); c.set(43, 21, 'e'); c.rect(48, 21, 2, 1, ['y'], { flat: 0 }); c.set(48, 21, 'e');
  c.poly([[45, 23], [48, 23], [47, 25], [46, 25]], ['e'], { flat: 0 });
  c.line(43, 27, 49, 27, '{'); c.set(44, 28, 'w'); c.set(48, 28, 'w'); c.line(44, 28, 48, 28, 'R'); c.set(44, 28, 'w'); c.set(48, 28, 'w');   // jaw open, fangs
  return finish(c);
}

function dragonPrince() {   // deep blue armour, a winged dragon helm with a gold crest, blade-like fins off the shoulders
  const c = canvas(), B = M.blue;
  [[20, 28], [36, 44]].forEach(([a, b]) => { c.rect(a, 50, b - a, 12, B, { k: 0.95 }); c.rect(a, 54, b - a, 2, ['k', 'd'], { flat: 0 }); c.rect(a - 1, 61, b - a + 2, 2, ['N'], { flat: 0 }); c.line(a + 2, 57, a + 2, 60, '_'); });
  c.poly([[19, 46], [45, 46], [46, 53], [34, 53], [34, 51], [30, 51], [30, 53], [18, 53]], B, { global: true });
  [24, 40].forEach(x => c.line(x, 47, x, 52, 'N'));
  [[[23, 39], [4, 30], [7, 34]], [[41, 39], [60, 30], [57, 34]]].forEach(([s, t, u]) => { c.poly([s, t, u, [s[0], s[1] + 4]], B, { flat: 2 }); c.line(s[0], s[1], t[0], t[1], '_'); });
  [[[22, 44], [9, 40], [11, 43]], [[42, 44], [55, 40], [53, 43]]].forEach(([s, t, u]) => { c.poly([s, t, u, [s[0], s[1] + 3]], B, { flat: 3 }); });
  [[16, 1], [43, -1]].forEach(([x]) => { c.rect(x, 41, 5, 9, B, { k: 0.9 }); c.ell(x + 2.5, 50.5, 3, 2.6, ['=', 'n', 'N'], { k: 0.8 }); });
  c.poly([[22, 34], [42, 34], [43, 46], [21, 46]], B, { k: 0.95 });
  c.ell(32, 39, 9, 5, B, { k: 0.8, clip: (x, y) => y < 42 });
  for (let y = 37; y <= 43; y += 3) for (let x = 26 + (y % 2) * 2; x <= 37; x += 4) { c.set(x, y, 'k'); c.set(x + 1, y, 'k'); c.set(x, y + 1, 'd'); }
  c.rect(21, 45, 22, 2, ['K', 'k', 'd'], { global: true }); gem(c, 32, 46, 1.4);
  [[20.5], [43.5]].forEach(([cx]) => { c.ell(cx, 37.5, 5.5, 4.5, B, { k: 0.85, clip: (x, y) => y <= 41 }); c.line(cx - 5, 41, cx + 5, 41, 'k'); });
  c.poly([[32, 0], [35, 4], [36, 20], [28, 20], [29, 4]], B, { global: true });
  c.poly([[32, 0], [34, 3], [33, 9], [31, 9], [30, 3]], M.phx, { global: true });   // gold crest
  [[[27, 18], [9, 4], [12, 4], [28, 14]], [[37, 18], [55, 4], [52, 4], [36, 14]]].forEach(pts => { c.poly(pts, B, { flat: pts[0][0] < 32 ? 1 : 3 }); c.line(pts[0][0], pts[0][1] - 2, pts[1][0] + 1, pts[1][1] + 1, pts[0][0] < 32 ? '_' : '='); });
  [[[24, 26], [12, 20], [14, 23], [24, 30]], [[40, 26], [52, 20], [50, 23], [40, 30]]].forEach(pts => c.poly(pts, B, { flat: pts[0][0] < 32 ? 2 : 3 }));
  c.ell(32, 25, 10, 10, B, { k: 0.85 });
  c.poly([[22, 25], [42, 25], [41, 34], [23, 34]], B, { global: true });
  c.rect(23, 21, 18, 2, ['k', 'k', 'd'], { global: true }); gem(c, 32, 21.5, 1.3);
  c.rect(26, 25, 12, 3, ['S'], { flat: 0 }); c.rect(30, 28, 4, 5, ['S'], { flat: 0 });
  c.rect(27, 25, 3, 1, ['e'], { flat: 0 }); c.rect(34, 25, 3, 1, ['e'], { flat: 0 }); c.set(28, 26, '@'); c.set(35, 26, '@'); c.line(31, 29, 31, 31, ':');
  c.line(26, 28, 29, 28, '/'); c.line(34, 28, 37, 28, '/');
  return finish(c);
}

function phoenixWarrior() {   // tall gold helm with phoenix-wing fans, gold scale coat, the ball raised to throw
  const c = canvas(), P = M.phx;
  greave(c, 20, 27); greave(c, 37, 44);
  // long gold scale coat panels hanging either side over a kit tunic
  c.poly([[22, 45], [42, 45], [44, 53], [20, 53]], M.kit, { global: true });
  [[[19, 44], [29, 44], [28, 56], [17, 54]], [[35, 44], [45, 44], [47, 54], [36, 56]]].forEach(pts => {
    c.poly(pts, P, { global: true, k: 0.95 });
    const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
    for (let y = 46; y < 55; y += 2) for (let x = x0 + 1 + (y % 4 ? 1 : 0); x < x1; x += 3) { c.set(x, y, '$'); c.set(x + 1, y + 1, 'G'); }
    c.line(pts[3][0], pts[3][1], pts[2][0], pts[2][1], 'k');
  });
  armDown(c, -1);
  // raised throwing arm and the ball
  c.poly([[41, 36], [46, 34], [50, 22], [46, 21]], M.kit, { flat: 3 });
  c.poly([[46, 27], [50, 28], [52, 20], [48, 19]], M.steel, { flat: 2 }); c.line(46, 27, 50, 28, 'g');
  c.ell(51, 12, 6, 4.6, M.leather, { k: 0.8 }); c.line(47, 12, 55, 12, 'w'); [49, 51, 53].forEach(x => c.line(x, 11, x, 13, 'w'));
  c.ell(50, 17.5, 2.6, 2.2, M.skin, { k: 0.8 });
  // chest: silver with a gold scale mantle over the shoulders, sash belt
  breastplate(c, { noSun: true });
  c.poly([[21, 33], [43, 33], [41, 40], [32, 42], [23, 40]], P, { global: true, k: 0.95 });
  for (let y = 34; y < 40; y += 2) for (let x = 23 + (y % 4 ? 1 : 0); x < 41; x += 3) { c.set(x, y, '$'); c.set(x + 1, y + 1, 'G'); }
  sashBelt(c, 44);
  pauldron(c, -1, P);
  // helm: gold, two tall feathered wing-fans rising from the sides, a crest between them, the red gem
  [-1, 1].forEach(s => {   // each fan: narrow at the helm, spreading up and out into feather tips
    const X = v => 32 + s * v;
    c.poly([[X(4), 21], [X(9), 14], [X(17), 6], [X(18), 2], [X(15), 1], [X(12), 0], [X(9), 2], [X(6), 8], [X(3), 15]], P, { global: true, k: 0.95 });
    [[5, 18, 17, 3], [5, 18, 14, 1], [4, 18, 10, 2], [4, 17, 7, 6]].forEach(([a, b, x, y]) => c.line(X(a), b, X(x), y, '$'));
    [[18, 2], [15, 1], [12, 0]].forEach(([x, y]) => c.set(X(x), y, 'w'));
  });
  c.poly([[32, 6], [34, 10], [35, 22], [29, 22], [30, 10]], P, { global: true });
  c.poly([[25, 18], [39, 18], [40, 26], [38, 33], [36, 33], [37, 24], [27, 24], [28, 33], [26, 33], [24, 26]], P, { global: true, k: 0.9 });
  face(c, 24); gem(c, 32, 20.5);
  return finish(c);
}

const OUT = { Lineman: lineman(), 'White Lion': whiteLion(), 'Dragon Prince': dragonPrince(), 'Phoenix Warrior': phoenixWarrior() };
if (require.main === module) {
  require('fs').writeFileSync(__dirname + '/hd-highelf.json', JSON.stringify(OUT));
  const L = require('./lib'), old = L.grabObj('SPRITES').highelf, pal = L.palette('#1e3a8a', '#ffffff', EXTRA), pal2 = L.palette('#b91c1c', '#facc15', EXTRA);
  const names = Object.keys(old), W = 272, im = L.img(names.length * W, W * 2 + 120, '#2f5a2f');
  names.forEach((n, i) => { L.blitGrid(im, old[n], pal, i * W + 8, 8, 8); if (OUT[n]) L.blitGrid(im, OUT[n], pal, i * W + 8, W, 4);
    L.blitGrid(im, old[n], pal, i * W + 8, W * 2 + 20, 1.25); if (OUT[n]) L.blitGrid(im, OUT[n], pal, i * W + 60, W * 2 + 20, 0.625);
    L.blitGrid(im, old[n], pal2, i * W + 120, W * 2 + 20, 1.25); if (OUT[n]) L.blitGrid(im, OUT[n], pal2, i * W + 170, W * 2 + 20, 0.625);
    L.blitGrid(im, old[n], pal, i * W + 8, W * 2 + 66, 1.5); if (OUT[n]) L.blitGrid(im, OUT[n], pal, i * W + 60, W * 2 + 66, 0.75); });
  L.png(im, process.argv[2] || __dirname + '/shots/sheet-old-v-new.png');
}
module.exports = { OUT, EXTRA };
