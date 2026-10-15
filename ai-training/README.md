# AI training data

Comparing how the computer plays BludBowl with how strong human coaches play on
[FUMBBL](https://fumbbl.com), to find where the AI should change. Nothing in this folder is part of the game.

## What's here

| File | What it is |
|---|---|
| `data/fumbbl-top-coaches.jsonl.gz` | 300 FUMBBL Competitive-division matches (2025 rules, FUMBBL ruleset "BB2025") between coaches rated 1550+, collected 15 Oct 2026. One line per match: `match` (teams, coaches and ratings, scores, per-player stats) and `stats` (FUMBBL's dice and action stats for each side, including a turn-by-turn breakdown). |
| `data/bludbowl-v3.04.jsonl.gz` | 180 BludBowl computer-v-computer matches on v3.04, every team about 12 games against random opponents. One line per match: every dodge / rush / pick-up / pass roll (target, result), every block (dice, who picks), every turnover (and why), every team re-roll. |
| `data/bludbowl-v3.02.jsonl.gz` | The same for v3.02 (84 matches), before the v3.03 pick-up change. |
| `bb-stats.js` | Plays the BludBowl matches and records those stats (uses the `?simtest` test mode, ~8s a match). |
| `compare.py` | Prints FUMBBL and BludBowl side by side, overall and (with `--races`) per team. |
| `fumbbl-collect.py` | Downloads more FUMBBL matches and their stats (one request a second). |
| `fumbbl-fetch-replays.js` | Downloads full FUMBBL replays. Untested, and can't run from a cloud session (see below). |

## What it showed (v3.04, per team per match)

| | FUMBBL top coaches | BludBowl AI |
|---|---|---|
| Touchdowns | 1.08 | 0.74 |
| Casualties caused | 2.4 | 1.4 |
| **Blocks thrown** | **46** | **24** |
| 1-die blocks | 5.1 | 1.0 |
| Blocks where the opponent picks the dice | 0.8 | 0.1 |
| Dodges tried | 13.7 | 10.5 |
| ... at 4+ or harder | 1.4 | 0.2 |
| Rushes (going for it) | 9.0 | 5.5 |
| Team re-rolls used | 4.7 | 2.6 |
| Turnovers | 5.3 | 4.0 |
| Turnovers from failed pick-ups (incl. Secure the Ball) | 0.5 | 0.8 |

1. **The computer throws about half as many blocks as good coaches** (about 1.5 a turn against 3). This holds for
   every team compared, e.g. Orcs 50 v 24, Humans 41 v 15, High Elves 30 v 11, Khorne 58 v 34. It is the biggest gap
   and probably behind much of the casualty and touchdown gap too.
2. **It is too cautious in general:** far fewer 1-die blocks, hard dodges and rushes, and it spends about half as many
   re-rolls. It still has nearly as many turnovers, because it does much less each turn for a similar number of failures.
3. **Pick-ups fail too often:** about 19% of its turnovers are failed pick-ups against 9% for good coaches.

Next step suggested: find out why it blocks so little (players moved next to opponents without blocking? turns ended
with players who could still block?), fix it behind an `AIX` switch, and test it with `tools/ai-match.js`. Then re-run
`bb-stats.js` and `compare.py` to see whether the gap has closed.

### Things to keep in mind
- FUMBBL teams are developed league teams (more Block, Guard, Mighty Blow, extra re-rolls); BludBowl's are starting
  rosters. That inflates the human casualty, 1-die block and re-roll numbers somewhat, but can't explain blocking half
  as often across every team.
- FUMBBL may count a re-rolled dodge or rush as two rolls; BludBowl counts each attempt once. So those two gaps may be a
  little smaller than shown. FUMBBL's re-roll count may include skill re-rolls (Dodge, Sure Hands...).
- Passes aren't comparable: FUMBBL counts completions, `bb-stats.js` counts accurate pass rolls.
- A good coach rating isn't perfect play; it's a yardstick, not a target to copy exactly.

## How to re-run

```
node ai-training/bb-stats.js --n 12 --par 4 --out ai-training/data/bludbowl-vX.YY.jsonl   # ~6 min for 180 matches
gzip -9 ai-training/data/bludbowl-vX.YY.jsonl
python3 ai-training/compare.py --bb data/bludbowl-vX.YY.jsonl.gz            # add --races for each team
python3 ai-training/compare.py --mincr 1700                                  # only matches between coaches rated 1700+
```

`bb-stats.js` records stats by wrapping the game's own functions from outside (`resolveBlock`, `triggerTurnover`,
`spendTeamReroll` and the roll prompt's Roll button). If one of those is renamed in `index.html`, update the hook in it.

## Getting data from FUMBBL

- The cloud environment must allow `fumbbl.com` (environment settings -> Network access -> Allowed domains; the Android
  app doesn't show this setting, the claude.ai/code website does).
- API documentation: https://fumbbl.com/apidoc/ and https://fumbbl.com/help:Fumbbl+API
  - `/api/match/list` and `/api/match/list/{lastId}`: completed matches, 25 at a time, newest first (each has a `replayId`).
  - `/api/match/get/{id}?verbose=1`: teams, coach ratings (`coach.rating.pre.cr`) and per-player stats.
  - `/p/match?op=stats&id={id}`: JSON dice and action stats for each side: dodges and rushes by target number,
    passed and failed; blocks by number of dice (negative = the opponent picks), re-rolled and successful; block dice
    faces; armour and injury rolls; every turnover with its action and whether it was re-rolled; re-rolls used; which
    players took which actions; and the same broken down by half, drive and turn.
  - `/api/ruleset/get/{id}`: the Competitive division uses ruleset 3906, "BB2025".
- **Full replays** (every move, with positions) aren't available over plain web addresses. FUMBBL's client
  ([source](https://github.com/christerk/ffb)) streams them over a WebSocket from `fumbbl.com:22223/command`
  (send `clientReplay` with the `gameId` = the match's `replayId`; messages are LZString-compressed JSON). Cloud
  sessions' proxy can't carry WebSockets, so `fumbbl-fetch-replays.js` has to be run on a normal computer and the
  files uploaded. [FUMBBLPlus/fumbblreplay](https://github.com/FUMBBLPlus/fumbblreplay) (Python, 2019) does the same and
  confirms the format; its authors ask that nobody mass-downloads replays without first contacting Christer and
  SzieberthAdam on FUMBBL. The `.jnlp` file the FUMBBL site offers is only a launcher for their Java client.
- Be polite to FUMBBL: it's run by volunteers. Fetch slowly and only keep summary data.
