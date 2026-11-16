# HD sprite test (v5.05, redrawn in v5.07)

A first look at doubling the sprites' pixel density: the four High Elf positions redrawn on a 64x64 grid, drawn at the same
size on screen. Off by default; add `?hd` to the address (https://sirspoon.github.io/BludBowl/?hd) or turn on
**Settings > HD sprites (test)**. Every other team keeps its 32x32 sprites.

- `sprites.js`: the drawings, as code. `node tools/hd-test/sprites.js` writes `hd-highelf.json` (the grids pasted into
  `SPRITES_HD` in index.html) and `shots/sheet-old-v-new.png` (old v new, large and at about real size, in two kits).
- `draw.js`: the little drawing kit: ellipses, polygons and lines filled with a *material* (a ramp of palette letters, lightest
  first) and lit from the upper left, so curved parts get real shading; then a dark outline round the figure.
- `lib.js`: reads the palette and sprites out of index.html, paints grids, writes PNGs (no dependencies).
- `shots/`: before/after screenshots from `node tools/ui-tests/hd-sprites.js tools/hd-test/shots` (desktop at 2x, a Pixel 7
  in portrait and its pitch, a close-up at the game's top zoom) plus `after-phone-pitch-crop.png` (the High Elf half at phone zoom).

## Reference
v5.07 redraws the four positions from Games Workshop's 2026 High Elf team (the Caledor Dragons; photos in the Warhammer
Community article "What exactly do the High Elves do in Blood Bowl?", 10 Mar 2026; `shots/reference-gw-2026.png`). What tells
them apart there, and so on the pitch: Linemen silver with a team-colour crest; White Lions a tawny lion pelt, a wide crouch and
a clawed arm flung out; Phoenix Warriors gold (tall winged helm, scale coat); Dragon Princes blue dragon wings. All have a red
brow gem and helmeted faces. The first pass (v5.05) gave everyone long fair hair, which made three of them look alike.

## How it fits in the game
Sprites were already painted onto a canvas the size of their grid and then scaled to the token size, so a 64x64 grid needed
almost nothing: `SPRITES_HD` + `HD` (the switch), `spriteSetFor` picking the HD set when on (so the pitch, dugouts, Team
Builder preview, memorial ghosts, block close-ups, replays and pass close-ups all follow), the idle crouch moving 2 HD pixels
per 32x32 one, an `|hd` sprite-cache key, and 20 extra palette letters (`$ ~ : ^ ; _ = / & @ ! | < > ? {` fixed, `( ) [ ]` from the kit).

## Findings
- **Looks:** the difference is plain close up and when zoomed in (faces with blue eyes and brows, pointed ears, shaded steel,
  the lion's muzzle and fangs, the Dragon Prince's scale pattern, flames). At normal zoom on a phone (tokens about 25-30 CSS px,
  70-80 screen pixels at the phone's pixel ratio) the 64 grid is about one pixel per screen pixel, so the extra detail is
  really there; on a 1x desktop screen (tokens about 45 px) it's drawn smaller than its grid and looks slightly softer.
- **File size:** +18.9 KB in index.html for one team's 4 sprites (4.3 KB each, plain text), but only +3.5 KB gzipped (GitHub
  Pages sends it compressed). All ~214 sprites: about +0.9 MB raw (3.5 MB -> 4.4 MB) and roughly +140 KB over the wire (+14%).
- **Speed:** painting a 64x64 sprite takes ~0.65 ms against ~0.17 ms (once per kit/pose, then cached); cached canvases are
  16 KB instead of 4 KB each. No visible cost while playing.
- **Effort:** with this drawing kit, about 10-15 minutes per sprite for a first pass plus review, so ~214 sprites is roughly
  40-50 hours of session time, one or two teams per session (shared parts like elf faces or orc heads speed it up).

## Alternatives worth weighing
- **Load HD sprites from a separate file** (e.g. `sprites-hd.js`) only when HD is on: no cost for anyone else, and index.html
  stays the same size.
- **Keep them as code** (like `sprites.js`) and draw them at start-up: almost no file growth, and parts are shared between
  teams, but changing a pixel means changing code.
- **Indexed PNG sprite sheets** (one per team, a palette entry per letter so kits still recolour): ~1 KB per sprite, editable in
  any pixel-art program (Aseprite, Piskel); needs a small loader that maps palette colours back to kit roles.
- **Run-length encoding** the grids: ~3-4x smaller in the file, but gzip already gets most of that on the wire.
- **Better shading at 32x32**: much cheaper (redo the shading only) and gets part of the way, without the finer faces.
