# Browser checks (tools/ui-tests)

Quick Playwright checks for the parts of the game that are easy to break and hard to see in an AI match. Run them from the repo
root; each prints PASS / FAIL lines, saves screenshots or files to an output folder (default `/tmp/bb-ui`) and exits non-zero
if anything failed.

| Script | What it checks | Time |
| --- | --- | --- |
| `node tools/ui-tests/team-builder.js` | Team Builder tabs (in the sticky summary box), hiring, Star Players on Hire players and the roster, roster rows, styled menus, landscape layout, desktop and phone | ~30s |
| `node tools/ui-tests/rulesets.js` | Rulesets screen and sections, copying GW, deleting/restoring examples, a pack team's ruleset check, computer teams drafted legally under every ruleset, the tournament form | ~30s |
| `node tools/ui-tests/touch.js` | Phone gestures: skill tags (tap vs swipe, closing, highlight), dragging teams between tiers | ~20s |
| `node tools/ui-tests/roster-pdf.js` | Roster PDFs for five kinds of team, their ruleset check, and the Export PDF download (needs the internet once, for jsPDF) | ~20s |
| `node tools/ui-tests/replays.js [--fumbbl 4755096]` | A thrown ball carrier in our own saved replays (and in a FUMBBL replay with `--fumbbl <matchId>`) | ~40s |
| `node tools/ui-tests/red-gobbo.js [--n=4]` | Da Red Gobbo's Squigmobile: Exhibition-only (never leagues, tournaments, Dwarfs), the shop list, his extra Bribe each half (used first, lost at half-time), and `--n` fast computer matches with him on both sides | ~2 min |
| `node tools/ui-tests/chaos-wastes.js [--quick]` | Chaos Wastes weather table (the option, every 2D6 result forced in a fast computer match, Changing Weather, a person's pick) and the Chaos Wastes pitch screenshots | ~4 min (`--quick`: 4 results, ~2 min) |

`lib.js` has the shared helpers: `openGame` (loads `index.html`, hides the splash; `{ device: 'Pixel 7' }` for a phone),
`setSelect` (the real `<select>`s are hidden behind the game's styled menus), `click` and `putTeam` (saves a team straight into
the game's storage).

Tips for new checks:
- Drive the game through its own modules (`TB`, `TRULES`, `CUP`, `FREP`, `REC`, `ROSTER_PDF`...) rather than pixel clicks where you can.
- Touch gestures: Playwright's `page.touchscreen.tap` for taps; a CDP session (`Input.dispatchTouchEvent`) for swipes and drags.
- `?simtest` makes matches fast but pauses background work, so leave it off for anything with timers, networking (`?nettest`) or replays.
- `?nettest` needs the page served over http (e.g. `python3 -m http.server`), not `file://`, for two tabs to talk.
- To force dice, replace `Math.random` in the page for a moment (see `replays.js`).
