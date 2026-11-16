// A tiny drawing kit for 64x64 sprite grids: shapes filled with a material (a ramp of palette letters, lightest first) and
// lit from the upper left, so curved parts get real shading; then a dark outline round the figure.
const N = 64;
const LIGHT = (() => { const v = [-0.45, -0.4, 0.8], l = Math.hypot(...v); return v.map(x => x / l); })();
function canvas(n = N) {
  const g = Array.from({ length: n }, () => Array(n).fill('.'));
  const set = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < n && y < n && ch) g[y][x] = ch; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < n && y < n) ? g[y][x] : '.';
  const tone = (mat, b, bias = 0) => {   // b: brightness -1..1 -> a ramp letter
    if (typeof mat === 'string') return mat;
    const t = Math.min(0.999, Math.max(0, Math.acos(Math.max(-1, Math.min(1, b + bias))) / 1.6 + 0.04));
    return mat[Math.min(mat.length - 1, Math.floor(t * mat.length))];
  };
  const lum = (nx, ny) => { const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]; };
  // ellipse; shade 'round' (sphere normals), 'flat' (one tone index) or a function
  function ell(cx, cy, rx, ry, mat, o = {}) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; if (nx * nx + ny * ny > 1) continue;
      if (o.clip && !o.clip(x, y)) continue;
      set(x, y, o.flat != null ? mat[o.flat] : tone(mat, lum(nx * (o.k || 0.9), ny * (o.k || 0.9)), o.bias || 0));
    }
  }
  // polygon, scanline filled; shade 'cyl' (rounded left-to-right across each row), 'flat'
  function poly(pts, mat, o = {}) {
    const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    const xsAll = pts.map(p => p[0]), X0 = Math.min(...xsAll), X1 = Math.max(...xsAll);
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = Math.round(xs[i]), b = Math.round(xs[i + 1]);
        for (let x = a; x < b; x++) {
          if (o.clip && !o.clip(x, y)) continue;
          let ch;
          if (o.flat != null) ch = mat[o.flat];
          else { const span = o.global ? [X0, X1] : [xs[i], xs[i + 1]], nx = ((x + 0.5 - span[0]) / Math.max(1, span[1] - span[0])) * 2 - 1;
            const ny = o.ny != null ? o.ny : (o.vy ? ((y + 0.5 - y0) / Math.max(1, y1 - y0)) * 2 - 1 : 0) * (o.vy || 0);
            ch = tone(mat, lum(nx * (o.k || 0.85), ny), o.bias || 0); }
          set(x, y, ch);
        }
      }
    }
  }
  const rect = (x, y, w, h, mat, o) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], mat, o);
  function line(x0, y0, x1, y1, ch, w = 1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (w <= 1) set(Math.floor(x), Math.floor(y), ch); else for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) set(Math.floor(x - (w - 1) / 2 + dx), Math.floor(y - (w - 1) / 2 + dy), ch); }
  }
  // outline: every empty pixel touching the figure (4-way) turns dark; thick adds the diagonals too
  function outline(ch = 'o', diag = false) {
    const add = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (g[y][x] !== '.') continue;
      const f = (a, b) => get(a, b) !== '.' && get(a, b) !== ch;
      if (f(x - 1, y) || f(x + 1, y) || f(x, y - 1) || f(x, y + 1) || (diag && (f(x - 1, y - 1) || f(x + 1, y - 1) || f(x - 1, y + 1) || f(x + 1, y + 1)))) add.push([x, y]); }
    add.forEach(([x, y]) => g[y][x] = ch);
  }
  // a dark line wherever two different materials meet (only drawn on the lower/right side, so it reads as shadow)
  function seams(groups, ch) {
    const grp = c => { for (const [k, s] of Object.entries(groups)) if (s.includes(c)) return k; return null; };
    const add = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const a = grp(g[y][x]); if (!a) continue;
      const up = grp(get(x, y - 1)); if (up && up !== a && groups[up + '_over'] !== false) add.push([x, y]); }
    add.forEach(([x, y]) => g[y][x] = ch);
  }
  const mirror = () => { for (let y = 0; y < n; y++) for (let x = 0; x < n / 2; x++) g[y][n - 1 - x] = g[y][x]; };
  const rows = () => g.map(r => r.join(''));
  return { g, set, get, ell, poly, rect, line, outline, seams, mirror, rows, tone, lum };
}
// materials, lightest first
const M = {
  steel: ['E', 'm', '|', 'M', 'i', 'I'],
  gold: ['Y', 'g', 'G', '$'],
  skin: ['~', 's', 'S', ':'],
  hair: ['^', 'h', 'H', ';'],
  kit: [')', 'k', 'k', 'd', '('],
  trim: ['l', 't', ']', 'T', '['],
  blue: ['_', '=', 'n', 'N', '/'],
  pelt: ['w', 'f', 'a', 'F', 'A', '&'],
  leather: ['b', 'B', 'c', 'X'],
  fire: ['Y', 'y', 'r', 'R'],
};
module.exports = { canvas, M, N };
