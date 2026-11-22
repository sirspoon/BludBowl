# Browser checks (tools/ui-tests)

Quick Playwright checks for the parts of the game that are easy to break and hard to see in an AI match. Run them from the repo
root; each prints PASS / FAIL lines, saves screenshots or files to an output folder (default `/tmp/bb-ui`) and exits non-zero
if anything failed.

| Script | What it checks | Time |
| --- | --- | --- |
| `node tools/ui-tests/team-builder.js` | Team Builder tabs (in the sticky summary box), hiring, Star Players on Hire players and the roster, roster rows, styled menus, landscape layout, desktop and phone | ~30s |
| `node tools/ui-tests/rulesets.js` | Rulesets screen and sections, copying GW, deleting/restoring examples, a pack team's ruleset check, computer teams drafted legally under every ruleset, the tournament form | ~30s |
| `node tools/ui-tests/touch.js` | Phone gestures: skill tags (tap vs swipe, closing, highlight), dragging teams between tiers | ~20s |
| `node tools/ui-tests/roster-pdf.js` | Roster PDFs for seven kinds of team, their ruleset check, big teams fitting one page (A4 and Letter) with the type as large as fits, and the Export PDF download (needs the internet once, for jsPDF) | ~20s |
| `node tools/ui-tests/replays.js [--fumbbl 4755096]` | A thrown ball carrier in our own saved replays (and in a FUMBBL replay with `--fumbbl <matchId>`) | ~40s |
| `node tools/ui-tests/red-gobbo.js [--n=4]` | Da Red Gobbo's Squigmobile: Exhibition-only (never leagues, tournaments, Dwarfs), the shop list, his extra Bribe each half (used first, lost at half-time), and `--n` fast computer matches with him on both sides | ~2 min |
| `node tools/ui-tests/hd-sprites.js [outDir]` | HD sprite test (`?hd`): the 64x64 High Elf grids are sound, the Settings switch, only High Elves change, paint cost, and before/after screenshots (desktop, phone, close-up) | ~1 min |
| `node tools/ui-tests/shirt-numbers.js` | Shirt numbers (desktop and phone, by touch): setting one, a bad number, a duplicate (refused, then Swap), a gap, reordering, a new hire, save + reload, export / import, a repeated number in a file, Journeymen and mid-match players, the match (player panel, away team from 1), the roster PDF order, "Number all by order", releasing a player | ~30 s |
| `node tools/ui-tests/turn-banner.js` | The turn banner after the computer's sped-up turn (Speed up) stays up its full ~1.9 s at normal speed | ~30s |
| `node tools/ui-tests/dice.js` | Animated dice: reduced-motion / test-run defaults, block dice off (at once) and on (tumble, Roll, settle matching `state.combat.dice`, team re-roll replayed, skip and roll by tap), the Roll Dice window's die, the computer's blocks instant, team-colour dice and the too-alike fix, Team Builder dice colours (picker, reset, following team colours, saved), phone portrait and landscape | ~1 min |
| `node tools/ui-tests/squig-rage.js [--n=4]` | Night Goblins: Squig Restraint, Squig Rage forced with loaded dice (the Block, a Ball & Chain Wrangler, Jump Up from Prone, flatten a team-mate or Distracted, the computer's pick, the team re-roll), their rulesets (Tier 4, not allowed in the example packs), and `--n` fast computer matches counting how often Squig Rage fires | ~2 min |
| `node tools/ui-tests/chaos-wastes.js [--quick]` | Chaos Wastes weather table (the option, every 2D6 result forced in a fast computer match, Changing Weather, a person's pick) and the Chaos Wastes pitch screenshots | ~4 min (`--quick`: 4 results, ~2 min) |
| `node tools/ui-tests/stadium.js` | Stadium & dugouts (test, `?stadium`): a KO and a casualty land in the right team's dugout bays (only after fading off the pitch), a recovered KO moves to Reserves, tapping a dugout player shows them in the Unit Panel, the setting, never in `?simtest` | ~30s |

`lib.js` has the shared helpers: `openGame` (loads `index.html`, hides the splash; `{ device: 'Pixel 7' }` for a phone),
`setSelect` (the real `<select>`s are hidden behind the game's styled menus), `click` and `putTeam` (saves a team straight into
the game's storage).

Tips for new checks:
- Drive the game through its own modules (`TB`, `TRULES`, `CUP`, `FREP`, `REC`, `ROSTER_PDF`...) rather than pixel clicks where you can.
- Touch gestures: Playwright's `page.touchscreen.tap` for taps; a CDP session (`Input.dispatchTouchEvent`) for swipes and drags.
- `?simtest` makes matches fast but pauses background work, so leave it off for anything with timers, networking (`?nettest`) or replays.
- `?nettest` needs the page served over http (e.g. `python3 -m http.server`), not `file://`, for two tabs to talk.
- To force dice, replace `Math.random` in the page for a moment (see `replays.js`).
