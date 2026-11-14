# BludBowl

A Blood Bowl game in a single file, `index.html`, hosted on GitHub Pages at
https://sirspoon.github.io/BludBowl/ (served from `main`).

## Workflow
- Commit and push straight to `main` — no feature branches or pull requests.
  The owner tests changes on the live site, which updates a minute or two after a push.
- Every change to the game bumps the version by 0.01 (e.g. v2.01 → v2.02).
  The version is the `#app-version` text on the title screen in `index.html`.
  Changes that don't touch the game (like this file) don't bump it.
- With each version bump, add an entry at the top of `CHANGELOG-FULL.md` (version, date, what
  changed in plain words, linking any issue it closes) and a short entry (its heading and a line
  or two) at the top of `CHANGELOG.md`, which is what the game's "What's new" shows (a condensed
  summary, rolled up into one entry at each major version, like v4.00). Pushing tags is blocked in cloud sessions, so
  the full log is the version history.
- When a change fixes an issue, comment on it saying which version fixed it and what changed
  (`gh api -X POST repos/sirspoon/BludBowl/issues/N/comments -f body=...`). Leave the issue
  open: the owner checks the fix on the live site and closes it themselves.
- Use the GitHub REST API (`gh api repos/sirspoon/BludBowl/...`) for issues;
  `gh issue list` and other GraphQL-based commands are blocked in cloud sessions.

## Rules
- The game follows the Blood Bowl 2025 (Third Season) rules. The owner uses
  https://bloodbowlbase.ru/bb2025/ as the reference (e.g. `core_rules/league_play/`,
  `core_rules/rules_and_regulations/`). The WebFetch tool can't reach it, but `curl` from
  the shell can: fetch the page and strip the HTML to read it.

## Working style
- The owner often keeps one long "control room" chat for planning and discussing bigger issues, and can have it start separate
  cloud sessions for individual jobs. A session started for one job should stick to it, push to `main` as usual (pull and
  rebase first: another session may have pushed meanwhile), and finish with a short report of what changed and the version.
- The owner tests on an Android phone (portrait and landscape) as well as desktop: check phone widths (~400px) and touch.

## Where things live in index.html (search for these names)
- `TB`: the Team Builder (tabs inside the sticky summary box `.tb-sum`; `render`, `mpRender`, `starRows`, `rulesCheck`).
- `TRULES`: rulesets. Built in: `gw` (GW Matched Play, skill points, uses the `MP` object), `gotg2` and `uktc11` (examples,
  deletable: hidden via `bb-tourn-hidden`). Custom rulesets in localStorage `bb-tourn-rules`. A ruleset's `skill` is `count`
  (primary/secondary per tier), `points` or `gold` (a pool per tier, with costs, stacks `p.mp2`, stat-ups `p.mp.kind 'C'`,
  Star Player costs); optional `raceBudget`. The Rulesets screen (`#trules`) also shows GW's League / Sevens rules read-only.
  A team stores `t.rules`; tournaments (`CUP`, online `OTOUR`) store `cp.rules`, check entries with `CUP.unfit`, and draft
  computer teams with `draftRules`. `TB.rulesCheck(t)` lists every limit and OK/OVER (used by the roster PDF).
- `ROSTER_PDF`: the roster sheet (jsPDF loaded from cdnjs on first use). `KEYWORDS`: each position's BB2025 keywords.
- `FANCY_SELECT`: the game's styled drop-down; it enhances every `<select>` automatically (a MutationObserver), with option
  groups as headings and a disabled option's " – reason" shown underneath.
- `setupSkillTips`: skill-tag descriptions (touch: open on tap only; closing doesn't block scrolling).
- Replays: `REPLAY` records close-ups during play, `PASSFX` draws them, `REC` saves "My matches" in FUMBBL's format, `FREP`
  is the viewer for our own and FUMBBL replays (FUMBBL player states: 16 picked up, 21 in the air while being thrown).

## Testing
- Browser checks for the Team Builder, Rulesets, touch gestures, the roster PDF and replays: `tools/ui-tests/` (see its
  README; e.g. `node tools/ui-tests/team-builder.js`). Each prints PASS/FAIL. Add a check there when fixing something fiddly.
- FUMBBL replays can be downloaded from the shell (`https://fumbbl.com/api/match/get/<id>` gives `replayId`, then
  `https://fumbbl.com/api/replay/get/<replayId>/gz`) and loaded with `FREP.start(json)` to test the viewer on real data.
- Two-device play (`NET` in `index.html`) uses PeerJS, which can't reach its server from a cloud session. Adding `?nettest`
  to the address swaps the network for a BroadcastChannel, so two tabs in one browser context can play each other.
  Add `&dev=A` (any letters) as well to give each tab its own saved data, like separate devices (needed to test shared leagues).
- AI testing: `?simtest` runs the game in test mode (the clock skips straight to the next event, there's almost no drawing,
  and background chores pause), so a computer-vs-computer match takes ~10s. `node tools/ai-match.js` plays batches of them in
  parallel and compares AI settings (the `AIX` switches): e.g. `--races orc,human --n 20 --new all --old rr,blitz --par 4`.
  It prints the touchdown and win splits with the chance each is just luck. Without Playwright / Chromium (the owner's PC):
  `node tools/ai-match-jsdom.js` takes the same options and runs the game in jsdom, a fresh Node process per match, several at
  once (~30s a match with 14 at once, so ~1,000 matches an hour); it also counts each side's 1-die and defender-picks blocks.
  Small real differences need big runs: 48 matches only show a win-rate change of about 10 points; ~300 show ~5. For `--old`
  "everything but one switch", list all the others (every `AIX.on(...)` name in index.html).
  `node tools/ai-whatif.js` judges one decision instead: it collects positions where two settings choose differently and plays
  both choices out from each (see the top of the file and `ai-training/README.md`, "What-if tests").
- The owner prefers a quick turnaround over big test runs. For an AI change: first measure the specific behaviour it targets
  (~24 matches), then a quick results check of ~48 matches (`--n 4` over 12 races) to catch anything clearly worse. Only go to
  ~100-150 matches when that's borderline or the change matters a lot, and say when a result is too close to call.
- AI research: `ai-training/` compares the computer's play with strong human coaches on FUMBBL (300 of their matches,
  stats per team) and keeps the scripts to re-run it. Main finding so far: the AI throws about half as many blocks as
  good coaches (24 v 46 a match) and is too cautious generally (few 1-die blocks, hard dodges, rushes or re-rolls).
  Read `ai-training/README.md` before working on the AI.
- Neural-network work (on the owner's PC): start with `ai-training/HANDOVER.md`.
- Benchmark opponent: the BotBowl Season 3 scripted bot is ported into the AI module (`bbChoose` and friends, "brain:
  botbowl"). Play BludBowl's AI against it with `node tools/ai-match.js --races human --n 100 --par 4 --newp '{"brain":"botbowl"}'`
  (it's written for Humans, the only team BotBowl Season 3 has). v4.19 baseline: ours won 48, drew 31, lost 21, TDs 86-48.
- No-browser runs: `node tools/headless-match.js orc human` plays a match with index.html inside jsdom (needs `npm i jsdom`),
  the base for driving the AI from other programs. BludBowl's AI as a BotBowl bot: `AI.bridge` (index.html) + `tools/bridge-server.js`
  + `tools/botbowl/` (how to set up and run: `ai-training/botbowl-bridge.md`). Baseline in BotBowl (v4.21, 120 matches v its
  scripted bot): won 71, drew 34, lost 15, TDs 123-36.
