const L = require('./lib'); const S = L.grabObj('SPRITES').highelf, pal = L.palette('#1e3a8a', '#ffffff');
const names = Object.keys(S), im = L.img(names.length * 272, 272, '#2f5a2f');
names.forEach((n, i) => L.blitGrid(im, S[n], pal, i * 272 + 8, 8, 8)); L.png(im, process.argv[2]);
