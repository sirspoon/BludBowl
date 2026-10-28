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
| `data/fumbbl-replays/` | 71 full FUMBBL replays (Oct 2026), the best-rated coaches' matches from the 300 above: four each for Orc, Human, Skaven, Dwarf, Lizardmen, Wood Elf, Chaos Chosen, Shambling Undead, Black Orc, Nurgle, High Elf and Amazon (Dwarf: all four there are), two each for Khorne, Necromantic Horror, Old World Alliance, Tomb Kings, Chaos Dwarf, Ogre, Imperial Nobility, Bretonnian, Norse, Dark Elf, Vampire and Elven Union (both sides of each match are in the file, so most teams appear more often). FUMBBL's own gzipped JSON, unchanged; `index.json` lists them. |
| `fumbbl-replays.py` | Downloads a few more replays into `data/fumbbl-replays/` (one every 3 seconds; skips ones already there). |
| `fumbbl-setups.py` | Kick-off set-ups from those replays: a summary, `--show <race>` draws them, `--bb <file>` summarises BludBowl's the same way. |
| `bb-setups.js` | The BludBowl computer's kick-off set-ups, from mirror matches, for `fumbbl-setups.py --bb`. |
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

## Progress check: v3.16 (Oct 2026)
The same 180 matches (`data/bludbowl-v3.16.jsonl.gz`), per team per match:

| | FUMBBL top coaches | v3.04 | v3.16 |
|---|---|---|---|
| Touchdowns | 1.08 | 0.74 | **0.88** |
| Casualties caused | 2.39 | 1.37 | 1.45 |
| Blocks thrown | 46.2 | 23.8 | 25.4 |
| 1-die blocks | 5.05 | 0.97 | 1.14 |
| Dodges tried (at 4+ or harder) | 13.7 (1.42) | 10.5 (0.23) | 10.3 (0.23) |
| Rushes tried | 9.0 | 5.5 | **3.1** |
| Team re-rolls used | 4.67 | 2.63 | 3.21 |
| Turnovers | 5.25 | 4.04 | 3.57 |
| Passes (accurate) | 0.40 | 0.06 | 0.12 |
| Pick-up turnovers (incl. Secure the Ball) | about 0.47 | 0.76 | 0.80 |

- Touchdowns closed about 40% of the gap (0.74 to 0.88), turnovers fell 12% and re-rolls rose 22%: it plays safer
  and smarter, not bolder. Blocks, hard dodges and casualties barely moved.
- Rushes fell from 5.5 to 3.1 a match (good coaches 9.0), mostly since v3.05 (nobody rushes just to reach a formation
  square). Trips while rushing fell from 0.48 to 0.19 turnovers a match. Coaches rush to reach blocks, blitzes and the
  carrier's support; the AI now almost never does. The biggest single gap left in how it plays.
- Pick-ups are now its third biggest cause of turnovers (22%; good coaches 9%): about 0.8 a match against 0.47. A 4+
  pick-up fails a third of the time (83 of 248); it picks up more often than before (1268 tries v 1175).

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
- **Full replays over plain HTTPS (found Oct 2026):** `https://fumbbl.com/api/replay/get/{replayId}/gz` returns the whole
  replay as gzipped JSON (about 180 KB, 4 MB unpacked), and it works from a cloud session. It isn't in FUMBBL's published API
  list; [gsverhoeven/fumbbl_replays](https://github.com/gsverhoeven/fumbbl_replays) (Python) uses it, waiting 0.3 s
  between files. Contents: `game` (both rosters, skills, the ruleset's options) and `gameLog.commandArray`, the server's
  command stream: `modelChangeArray` entries (`fieldModelSetPlayerCoordinate`, `fieldModelSetPlayerState`,
  `fieldModelSetBallCoordinate`, `actingPlayerSetPlayerId`, `turnDataSetTurnNr`...) and `reports` (`playerAction`,
  `blockRoll`, `blockChoice` with `nrOfDice`, `dodgeRoll`, `goForItRoll`, `pushback`, `kickoffResult`...). Coordinates
  are x 0-25, y 0-14, as in BludBowl. That package also has parsers for set-ups, block choices, dodges and rushes. Keep it
  to a few dozen replays, fetched slowly, as below. (The older way, below, is no longer needed.)
- **The older way:** full replays weren't thought to be available over plain web addresses. FUMBBL's client
  ([source](https://github.com/christerk/ffb)) streams them over a WebSocket from `fumbbl.com:22223/command`
  (send `clientReplay` with the `gameId` = the match's `replayId`; messages are LZString-compressed JSON). Cloud
  sessions' proxy can't carry WebSockets, so `fumbbl-fetch-replays.js` has to be run on a normal computer and the
  files uploaded. [FUMBBLPlus/fumbblreplay](https://github.com/FUMBBLPlus/fumbblreplay) (Python, 2019) does the same and
  confirms the format; its authors ask that nobody mass-downloads replays without first contacting Christer and
  SzieberthAdam on FUMBBL. The `.jnlp` file the FUMBBL site offers is only a launcher for their Java client.
- Be polite to FUMBBL: it's run by volunteers. Fetch slowly and only keep summary data.
- Before downloading replays in bulk, ask Christer (who runs FUMBBL) first, and say what it's for, roughly how many, and
  that it runs slowly outside busy hours. In a 2019 forum thread
  ([Developers' Den](https://fumbbl.com/index.php?name=PNphpBB2&file=viewtopic&t=30534)) he called the WebSocket method
  "a supremely terrible way of downloading replays": it's tolerated, not welcome. A few replays by hand is fine. The
  per-match stats above come from FUMBBL's ordinary web pages and API, which is fine as it is.

## Passing: what's been tried, and ideas (Oct 2026)

- The AI hardly passes (about 0.1 completions a match against 0.4 for good FUMBBL coaches). Loosening its passing
  tolerances (a dodge to reach the throw, a lower bar for scoring passes) changed nothing: it rarely has anyone to pass to.
- On turns with the ball, a team-mate was open 3+ squares ahead only 13-41% of the time. A "receiver" role (best catchers
  wait in open squares ahead, in pass range, out of reach of most opponents) raised that for some teams (Wood Elves 33% to
  67%) but the AI still didn't throw, and an 8-setting sweep (16 mirror matches each) showed no gain. Kept as a patch, not in the game.
- Why: switching the play values a spot mostly by squares gained (`ballSpotValue`), so a pass needs ~73% odds to beat
  walking the ball up, and only passes that score this turn get extra credit.
- Next idea: value where the ball would be by what it opens up next turn: the free run from there (`nextTurnLane`), how
  few of their players can reach it, and our players nearby to support it. That would also reward a **sideways pass to the
  weak side** when most players are bunched on one side (the owner's point) - a good play with no squares gained.
- Tried next (Oct 2026), all kept in `passing-experiments.patch` (apply with `git apply`; every change sits behind an `AIX`
  switch, and the tuning values behind `AIX.p`, so `tools/ai-match.js --newp` can sweep them):
  - `passv`: judge the ball's spot by the next-turn value above (free run, how many opponents can reach it, support).
  - `recvfirst`: with the carrier still to act, move the receivers into open squares in pass range first, so the pass can
    happen this turn (before, receivers only got into place after the carrier had acted, and were marked by next turn).
    `recvMin: 0` lets receiver squares be level with the carrier (a sideways switch).
  - Result over ~400 sweep matches: hand-offs and passes went up (about 25 a match-set of 16 against 18), but no setting
    beat the current AI by more than luck; taken together they were slightly worse. Not released.

## Ideas from coaching guides, tested (Oct 2026)

From creativetwilight.com, grumbbl.co.uk and Goonhammer's beginner-to-intermediate guides. Most of their advice the AI
already follows (dice-free actions first, block order by dice, screens two squares apart, wide-zone defenders two back,
cage in midfield, stalling, fouling last, re-rolls for what matters). It also always stands up every prone player it can
(measured: none left lying down at the end of 342 turns). Tested with 48-match quick checks against v3.09, none released:
- Don't activate Bone Head / Really Stupid / Savagery / Fury big guys just to reposition near the action: 19% fewer
  failed rolls, but 31-41 touchdowns, 9-15 wins (they ended up out of position).
- Big Guys and Loners block after everyone else's blocks: 26-38 touchdowns, 14-19 wins (their blocks are usually the best).
- The passing play only when behind with 3 turns left (`latepass-experiment.patch`): came back 2 times in 14, against
  4 in 18 without; passes barely rose. Overall 48-42.
- A safety kept well behind the ball while attacking: 41-43, 16-17. Neutral.

## Flank runners (v3.10)
The owner's idea: get a couple of players round the sides, behind the opposing team. Before, a team holding the ball had
someone in behind on a flank (wide rows, past all but one opponent) 21% of its turns, two players 4%. The `flank` role
sends two quick players to unmarked wide squares level with the opponents' second-deepest player (33% / 13% after).
Sweep: two players level with the line and one player one square past both led by 14 touchdowns over 48 matches;
three squares past was level. Released with two players, level (`flankN` 2, `flankPast` 0): +19 touchdowns, 37-23 wins
over 96 matches including 48 on teams not used in the sweep.
Also checked this session: no move ever crossed a loose ball's square (forced pickups); pickups fail 16%, hand-off catches 11%.
- Flank options tested against v3.10 (`flank-options.patch`; settings `flankN`, `flankHunt`, `flankAssist`, `flankScreen`),
  16 mirror matches each: three runners -5, hunting fragile opponents (ST<=3, AV<=8) -7 (1-7: it runs them into contact),
  assists from behind on an opponent already locked up with ours -2, screening the carrier's lane -4, hunt+screen -2.
  All four together led by 11 over 48 matches (all of it on passing teams) but lost 40-46 on the 12 teams outside the
  sweep (passing teams 3-7). None released: two plain runners in space stays best.

## Skills (v3.11)
Before v3.11 the AI's decisions referred to about 32 of the game's 100+ skills: those that change a roll's odds (via the
rules code) plus a few tactical ones. v3.11 adds (switches `hitskills`, `vomit`, `gaze`):
- Block judgement: Wrestle (Both Down = both Prone, no Turnover), Mighty Blow / Claws (knockdowns worth more by the rise in
  armour-break chance), Dauntless (dice as the real mix), crowd surfs (a push square off the pitch; with Frenzy, from one in).
- Projectile Vomit for a Troll with no good block; Hypnotic Gaze on a marker of our ball carrier. The AI's turn loop also
  had to learn to keep acting in the Vomit mode (it froze there at first).
Results: 47-26 touchdowns, 24-12 wins on 12 teams with these skills; 42-38, 17-18 on the other 12. Blocks per team per
match rose about 10% where the skills are present (24.5 to 27.0).
Not done yet: Frenzy follow-up risk, Stand Firm / Sidestep / Fend when choosing whom to block, avoiding Diving Tackle /
Shadowing when dodging, Sure Feet / Sprint in rush risk, Multiple Block, Grab, Leader, Pro, Dump-off.
Seen in testing (recovered by the safety net): a bomb scattering left the game waiting - fixed in v3.16 (bomb flights only
landed when drawn, and test mode barely draws), as was a Frenzy second block starting while a pushed-loose ball bounced.
- v3.12 (`skills2`): move odds count Diving Tackle and Sure Feet (also what a person sees); a push on a Stand Firm player is
  worth little. Neutral in a 48-match check (50-52), as these skills are rare on starting rosters. Tried and dropped: counting
  Frenzy's forced second block as extra risk - Frenzy players then blocked far less (23.7 to 19.3 blocks a match) and lost
  37-51. The rest (Multiple Block, Pile Driver, Hit and Run) keep their fixed answers (declined); Dump-off is used when the
  receiver is unmarked, Stand Firm and Diving Tackle always.

## Developed teams (`tools/ai-match.js --dev`)
Starting rosters have few skills, so skill work barely shows in tests. `--dev` gives every player a typical extra skill or
two for their position, the same on both sides (big guys and ST4+: Guard/Block; blitzers: Tackle/Mighty Blow; catchers:
Dodge/Catch or Sure Hands; throwers: Sure Hands/Accurate; linemen in turn Block/Guard/Wrestle/Tackle, plus Dodge on agile
teams). With it (48 matches each, against the AI without the change):
- The v3.11/v3.12 skill awareness: 49-35 touchdowns, 21-10 wins (level on starting rosters for the same teams).
- Assist setup (a spare player, Guards even when marked, steps in to make a 2-dice block): 34.6 v 30.5 blocks a match and
  87-60 casualties, but 37-42 touchdowns, 14-21 wins. Not released (same as on starting rosters).
- Block-order look-ahead: 47-40, 17-16. Not released.

### Which skills the AI plays best with (v3.13 league picks)
`--devnew`/`--devold` give each side its own skills by role (JSON like `'{"big":["Block"]}'`; roles big, strong,
blitzer, catcher, thrower, lineman), so two skills can be compared head to head. 48 matches each, new v old:

| Role | New v old skill | Touchdowns | Wins |
|---|---|---|---|
| Big guys | Block v Guard | 59-36 | 21-7 |
| Big guys | Block v Mighty Blow | 52-35 | 22-12 |
| Linemen | Wrestle v Block (two runs) | 93-74 | 34-19 |
| Linemen | Block v Guard | 45-47 | level |
| Blitzers | Mighty Blow v Tackle | 40-41 | level |
| Catchers | Sure Hands v Dodge | 49-30 | 23-12 |
| Catchers | Dodge v Catch | 46-42 | level |
| Throwers | Sure Hands v Accurate | 45-34 | 23-11 |
| Ball handlers | Block v Sure Hands | 44-36 | about level |

So in leagues the computer now picks by position (`aiPicks` in `CAREER`): big guys Block (3 in 4 save up for it as a
secondary skill), then Mighty Blow, Guard; catchers, runners and throwers Block, Sure Hands, Dodge; linemen Wrestle,
Tackle; everyone else the old `AI_PICKS` order. Since v3.14: no Block with Wrestle (they overlap); the Elite skills
(Block, Dodge, Guard, Mighty Blow, +10k value each) come last for linemen and once three team-mates have gained one;
and `aiChoose` takes the 1st/2nd/3rd available choice 60/25/15% of the time, so teams differ. Since v3.15 about a
third of a lineman's advancements are random primary skills (two rolled, the better kept; fixed per player and
advancement, so it doesn't get a fresh chance after every match).

## Blocking more (Oct 2026, not released)
Where the block gap comes from (`block-chances.js`, 12 mirror matches on v3.15, per team per match): turns start with
about 22 players next to an opponent with a 2-dice block (about 12 taken; most of the rest move off once their opponent
has been knocked down, about 2.5 just stand there), 1 with 3 dice (nearly all taken) and 31 with only 1 die (about 4
taken, 20 left standing there at the end of the turn). So the AI rarely skips a good block; the gap is mostly 1-die
blocks and blocks it never sets up.
- `lateblk` (`late-blocks.patch`): once everyone else has acted, a player still next to an opponent blocks, even on one
  die, since a Turnover costs nothing more than our player lying down (`lateDown` 4, +`lateScreen` 3 for a defender near
  their carrier; `lateMin` 1; `lateOne` 0 for 2 dice only). Blocks rose from 24 to 31-32 a match, but results were level:
  116-115 touchdowns over 192 matches with the default settings. Sweeps (48 matches each): `lateDown` 6 33-32, 10 33-45;
  `lateMin` 2 42-46; 2 dice only 42-38. A 1-die block without Block is about an even trade (a third of the time their
  player goes down, a third ours), and our player lying down leaves a gap for their turn, so it doesn't pay on starting
  rosters. Its re-roll fix (no team re-roll on the last block of the turn unless spare) is in the patch too.

## Defence leaks (Oct 2026, not released)
`defence-leaks.js` (24 mirror matches on v3.15): about 23 of 28 touchdowns conceded came the turn after a defensive turn
that ended with their carrier having a 60%+ chance of simply running it in (dodges and Rushes counted, a team re-roll
as saving one roll). In most of those turns the chance was already ~100% when our turn began, and the players still
able to act had nowhere useful to go: the carrier was already past them. Why the AI misjudges: its screen and plug
treat any tackle zone as a wall (`threatOf` uses the dice-free run), so half a screen looks complete; and plugs only use
moves with no dice. Tried (`defence-screen.patch`, every change behind `plug2` / `AIX.p`):
- `plug2`: plugs judged by the carrier's real chance of scoring (`scoreChance`, via the game's own move odds), with pairs
  of defenders tried together (one alone is often dodged round), then a Rush/dodge into the way after the carrier blitz
  when worth the Turnover risk. With dodges allowed (marked players dodging away to plug): 32-46, 10-20 over 48 - it
  freed whoever they were holding up. Rushes only, from unmarked players: 48-44. Dice-free plugs only: 43-39. Level.
- Screen shape (`scrMax`, `scrFrac`, `scr2Gap`, `deepDz`), 16 mirror matches each: screen up to 6 squares ahead 10-16,
  further out too 11-17, second line 3 back 15-14, a deep safety from 3 squares out 15-15, all three 15-10. The
  combination over 112 matches: 98-86 touchdowns, 37-33 wins - too close to call.
- Two turns ahead (`plugTwo`, `twoW`; now in the same patch): plugs also count the squares the carrier could reach this
  turn from which it could score next turn (each worth `twoW` 0.5 x how close it is, divided by 1 + our players who
  could get there), with candidate squares out to twice its reach. 22-23 over 24 matches against v3.15, and matches ran
  three times slower. Leaky turns (carrier 60%+ to run it in) with both sides on it: 29 (23 scored) against 23 (19)
  with the old defence over 24 matches each. No better.
- Screens that hold up against blocks (`plugRobust`, `robP` 0.5, `robTop` 8; in the same patch, with `plugTwo` now off
  by default): a screen judged by its worst case - each of our players in the carrier's way whom one of theirs could
  block or blitz, knocked over with chance `robP` - with the 8 most promising plugs rescored that way. Over 24 matches
  each (both sides on it, then both on v3.16): 37 v 36 touchdowns scored the turn after a defensive turn, 31 v 37 turns
  ending with the carrier 60%+ to run it in; matches ran 2.5 times slower. No better.
So a better plug alone doesn't stop the leaks, even allowing for their blocks: in most leaky turns the carrier was
already past everyone still able to act, so the screen has to be in the right place a turn or more earlier. Still untried: keeping one or two players goal-side of every opponent who could take a hand-off.

## Turn order (Oct 2026, not released)
`turnover-cost.js` (24 mirror matches on v3.15, 189 turnovers): at a turnover 4.5 players on average were still to act.
- Safe blocks (under 5% risk) were almost never lost (4 in 189): the AI already throws them first.
- The costliest turnovers were ball actions early in the turn: failed catches/passes (20, 7.6 players still to act
  each, 73 of them free to move without dice) and failed pickups (24, about 7 each, 63 free). In attack, risky blocks
  thrown before the carrier and cage had moved (19, 65 free movers lost). Dodges and Rushes came late (under 3 left).
- `order` (`turn-order.patch`): before a pickup under 95%, up to three team-mates take the ball's diagonal squares
  without dice (cage corners if it works, round the loose ball if not); with the ball, a risky block that doesn't help
  the carrier waits until the carrier has moved and the cage is built. Pickup part alone: 52-51 over 72 matches. Both:
  128-123 touchdowns, 46-47 wins over 144 matches; turnovers 7% down in the first 96, level in the last 48. Level.
Hand-offs and passes weren't changed: the receiver runs on after the catch, so pre-placing a cage round them doesn't work.

## Fouling (Oct 2026, not released)
Top FUMBBL coaches foul 1.23 times per team per match (half of their teams not at all). `fouls.js` on v3.16 (24-36
matches per run): the AI fouls about as often (1.25-1.4), nearly always a positional (about 90% of victims: Blitzers,
Saurus, Gutter Runners, Witch Elves...; `foulWorth` rates hitting and ball skills, speed and ST 4+, and plain linemen
low), with 1.0 assists on average; the armour broke on about 45% of fouls, and about 1 in 6 foulers was sent off.
- `foulset` (`foul-setup.patch`): before the foul, up to two spare team-mates step in, without dice, next to the victim
  where nobody marks them (+1 each), held back from the end-of-turn positioning for it. Assists rose to 1.2 a foul and
  the armour broke on about 55% (two runs disagreed: 48/100 v 44/90, then 49/77 v 26/65), but over 48 matches: 41-36
  touchdowns, 19-18 wins, casualties 46-47. Fouls are too rare (about one in a match) for this to show in results.

## Rushing (Oct 2026, not released)
Where the rush gap comes from: since v3.05 (`safepos`) nobody rushes to reach a formation square except to mark or hunt,
plugs never rush, and the general blitz (`blitzPlan`) ignores any route under 90% (one Rush is 83%) and needs a score of
3, which a blitz needing a Rush (or a 1-die blitz) never reaches. So it rushes mostly with its carrier and carrier blitzes.
`rush2` (`rushing.patch`): Rushes allowed to formation squares (and counted when choosing who goes where) when few
team-mates are still to act (`rushLeft` 3) or re-rolls are spare (`rushRR` 2); a blitz may Rush (`rushProb` 65%), a failed
one costing `rushFail` 2 + 1 per team-mate still to act; a second chance to blitz at the end of the turn; and a lower bar
for blitzing (`blitzMin` 1.5). Rushes only rose from 3.1 to 3.6 a match (coaches 9), blitzes from 8 to 10.5 in a 30-match
stats run, but over 48 matches against v3.16: 41-43 touchdowns, 15-14 wins, casualties 47-59, blocks level. The
formation-only version swept over 5 settings (16 matches each) was 59-74 in all. Not released.

## Pick-ups (Oct 2026)
`pickups.js` (36 mirror matches on v3.16, about 3.5 pick-ups per team per match; note the roll is set up just before the
player steps onto the ball, so measure at the ball's square):

| Pick-up | Tries | Failed | Opponents next to the ball |
|---|---|---|---|
| 2+ (nearly all Secure the Ball) | 91 | 1% | 0 |
| 3+ | 94-102 | 13-16% | 0.1 |
| 4+ | 42-54 | 24-41% | 0.9 |
| 5+ | 14-15 | 33-64% | 1.7 |

- Secure the Ball (2+, allowed in the game when no standing opponent is within 2 squares, once a turn, not for big
  guys) is already used about 2 times a match and almost never fails (1 in 67). It was allowed but not used for about
  15 Agility 3 pick-ups without Sure Hands in 36 matches; using it there would save roughly one turnover in 15 matches.
  With Sure Hands an ordinary 3+ pick-up (89%) beats it (83%) and the player can carry on moving.
- The losses are the 4+ and 5+ pick-ups next to opponents (about 0.45 turnovers a team a match), where Secure the Ball
  isn't allowed. A team-mate with an easier roll was almost never available; a marker could have been blocked first in
  about 1 in 4 (the `loose` switch already clears markers first when it can, under 75%).

## Protecting the carrier (v3.60)
The owner's observation: the AI finds a gap and sends fast players through with the ball (the Lizardmen especially), but
leaves the carrier poorly protected, so it's easily blitzed. `carrier-support.js` (24 mirror matches, 6 teams, at the end of
each turn ending with our carrier on the pitch): the ball was lost the next turn 34% of the time with nobody next to the
carrier, 38% with one, 26% with two, 13% with three or more; after a run of 4+ squares 43% of carriers had at most one
team-mate next to them. Cause: `carrierScore` gave 1.5 a square gained but only 0.6 per possible supporter, and
`cagePotential` counted anyone within reach as the crow flies (through tackle zones and blocked routes).
- `cagefit`: support counted as team-mates already next to the square plus those with a dice-free route to a free square
  beside it (one square each), worth `supW` (0.5) x (1 + `supReach` (0.5) x opponents who could reach it, up to 4) per
  supporter (diminishing: 1, 1, 0.8, 0.6). Behaviour: lost next turn 26% to 23%, alone-or-one after a run 43% to 33%,
  three-or-more support 99 to 117 turns, long runs not fewer (141 to 159). `supW` 0.9 was worse (30% lost).
- Results against the AI without it: 53-37 touchdowns, 22-9 wins over 48 matches (12 teams); then 83-73, 37-32 over 96
  (24 teams). 144 in all: 136-110, 59-41, turnovers 519-559. Released.
- Why the Skaven lose it most (`carrier-support.js` with `skaven:orc`-style pairs and `DETAIL=1`, 48 matches against six
  teams): 37% of Skaven carrier turns lost the ball next turn, against 18-31% for those teams against the Skaven. All their
  carriers are AV8-9 without Block (55 of 97 losses were the carrier knocked over), 43% of turns ended with one team-mate
  or none next to the carrier (about half lost), Clanrats carried in 84 of 261 turns (44% lost), and a carrier ending the
  turn marked was lost 69% of the time. In mirror matches it's about 50%, as Gutter Runners are the best at taking it back.
  Ideas not yet tried: hand off from a slow carrier to a Gutter Runner readier on fast teams; a poorly supported carrier
  hangs back instead of pushing on alone.
- Tried (`fast-carrier.patch`, switches `fasthand`, `hangback`): `fasthand` gives a receiver at least 2 MA quicker than the
  carrier the passing teams' bonus (+`fastBonus` 2 when it could run in next turn and at most one opponent can reach it) and
  the lower bar (0.8); `hangback` takes `hbPen` 1.5 off a forward square where the carrier would have at most one supporter
  and 3+ opponents in reach (unless within a turn's run of the end zone). Skaven carrier turns lost next turn, 48 matches each
  against six teams: 32% without, 32% `fasthand`, 36% `hangback` (runs vary by about 5 points). `fasthand` didn't get the
  ball to Gutter Runners more often. Results for `fasthand`, 48 matches on 12 fast/agile teams: 55-53 touchdowns, 17-20 wins,
  hand-offs 84-71. Neither released. The Skaven's losses look mostly built into the team (AV8 without Block everywhere).

## Following up and assists (v3.61)
The owner's observation: strong players who are unlikely to get the ball (Saurus, Kroxigor...) often don't follow up, so
they're less often placed to block next turn. `follow-ups.js` (24 mirror matches on six strength teams, v3.60): blocks
25.8 per team per match; strong non-carriers (ST 4+ or AV 10+) followed up 50% of the time (Kroxigor 38%, Trolls 35%,
Dwarf Blitzers 34%), held back because the vacated square had more tackle zones (665 of 766 choices). Those who followed
blocked again next turn 36% of the time against 25% for those who stayed (a link, not proof).
- `follow2` (`follow-ups.patch`): strong non-carriers follow up unless the square has `fuTz` (2) more tackle zones than
  where they stand (beyond the old allowance) or is worse for the sideline. They then followed 96%, and blocks rose to
  28.1 a match on those six teams. Results against the AI without it: 39-38 touchdowns, 18-16 wins over 48 matches (12
  teams); 74-78, 26-29 over 96 (24 teams; blocks there 22.8 v 23.9). 144 in all: 113-116, 44-45, casualties 161-174. Level.
- `assist2` (with `follow2`, both in `assist-blocks.patch`): `assistPlan` (step 5c) used to line up a dice-free assist only
  next to key opponents (markers of our carrier, lane blockers, their carrier). With `assist2` any standing opponent one of
  ours is next to counts (worth `astWorth`, 1), and a spare player may also step next to one of the defender's helpers
  (at most 2 tackle zones there) to cancel that assist. On the six strength teams: blocks 30.0 → 33.3 per team per match,
  1-die 1.9 → 2.0, 2-dice 25.2 → 28.2 (`follow-ups.js` now prints blocks by dice). Against the AI with neither, on 12
  teams: blocks 29.6 v 21.2 per team per match, 128-134 touchdowns, 41-43 wins (60 drawn), casualties 146-134,
  turnovers 555-515 over 144 matches. Level: the computer blocks more (still short of the FUMBBL coaches' 46),
  but it doesn't win more for it.

## Kick-off set-ups (Oct 2026, from 71 FUMBBL replays)
`fumbbl-setups.py` on the 71 replays (247 kick-offs, each side) against `bb-setups.js` on v3.62 (24 mirror matches, 12
teams; 81 kick-offs). "Back" counts squares behind the team's own side of the line of scrimmage.

| | FUMBBL kicking | BludBowl kicking | FUMBBL receiving | BludBowl receiving |
|---|---|---|---|---|
| on the line | 3.1 | 3.0 | 6.5 (5-9 usually) | 3.0 (always) |
| 1-3 back | 5.2 | 3.2 | 2.5 | 4.5 |
| 4+ back | 2.1 (none at all in 140 of 247) | 4.4 (6 in 52 of 81) | 1.3 (one returner in 177 of 247) | 2.7 |

- Receiving, good coaches put most of the team on the line (6-8), ready to block on the first turn, with two or three
  just behind and one back to take the kick. The AI always puts exactly 3 on the line. Every team does this; the agile
  ones a little less (Wood Elf 5.1, Skaven 4.7, Elven Union 4.0, Human 5.3 on the line).
- Kicking, they keep a screen 1-3 squares behind the line and usually nobody deep. The AI usually stands six players 7
  back. Coaches kick deep (6+ players 4+ back) almost only late in a half: 39 of 65 kick-offs at turn 7-8, against 6 of
  179 earlier (and 37 of 104 when ahead, 9 of 129 level, 0 of 14 behind), to stop a quick touchdown before half time
  or the end. Skaven kick a little deeper than others (3.6 players 4+ back).
- The AI's set-ups barely change by team or by the clock.

### How the receivers answer the kicking set-up
The kicking team sets up first, so the receivers can react. `fumbbl-receive.py` scores each receiving set-up against
the kickers it really faced, and against kicking set-ups from other kick-offs (the baseline: the same shape, no reaction).
247 FUMBBL kick-offs; the BludBowl computer (v3.62, 81 kick-offs) alongside.

| | coaches: real v baseline | BludBowl: real v baseline |
|---|---|---|
| kickers' line players with a 2+ dice block on them for turn 1 (of ~3) | 2.28 v 1.95 | 0.94 v 1.13 |
| kickers' line players with 0 / 1 / 2 / 3+ receivers next to them | 0.09 / 0.39 / 1.11 / 1.49 v 0.13 / 0.67 / 1.21 / 1.11 | 0.91 / 0.42 / 1.09 / 0.58 |
| receivers' ST4+ line players facing a soft kicker (ST3 or less, no Block) | 57% v 49% | 11% v 30% |
| ...facing an ST4+ kicker | 20% v 22% | 91% v 66% |
| a wide zone the kickers left empty gets a receiver | 93% v 86% | (kickers never leave one) |

- Coaches line up so each of the kickers' three line players has two or three receivers next to it (one blocks, the
  others assist), which is what gives them more 2-dice blocks than their shape alone would. They leave almost none
  unmarked (0.09 a kick-off), and they don't avoid the kickers' big players either: 76% of ST4+ or Guard line players
  get two or more receivers next to them.
- They put their strong players opposite the soft kickers.
- They fill a wide zone the kickers leave empty.
- No sign that the backfield moves to where the kickers' screen is thin (the row-by-row correlation is the same as the
  baseline, +0.21).
- The computer, with only three on the line, leaves about one of the kickers' line players unmarked each kick-off, gets
  fewer 2-dice blocks than chance, and lines its strong players up against the kickers' strong players.

### The new set-ups (`setup2`, v3.63)
- Kicking (`screen` in `SETUPS`): three cheap linemen in the middle of the line (rows 6-8), a screen at 2-3 back
  (x 9-10: rows 2, 4, 5, 7, 9, 10, 12) and one player 4 back. `lastTurn` (deep) is kept for the receivers' last turn,
  which is when the coaches go deep too (32 of 41 when ahead, 4 of 10 level).
- Receiving (`offence2`): N on the line chosen square by square so each of the kickers' line players gets two or three
  of ours next to it, strongest opposite softest; a flanker a square back in each wide zone, a pocket, a returner 6 back.
  Short-handed teams use it too (the squares fill in order).
- Measured (`bb-setups.js`, `fumbbl-receive.py`): receiving, 2.74 of the kickers' 3 line players can be hit with 2+
  dice on turn 1 (coaches 2.28, old AI 0.94); our ST4+ players face a soft kicker 94% of the time (old 11%).
- Results against the old set-ups: with 7 on the line (as the coaches do) 123-139 touchdowns, 41-49 wins over 144
  matches. Split: the kicking screen alone was level (68-69, 24-26 over 72); the 7-man receiving line alone was worse
  (54-66, 22-30). `drives.js` showed why: the receivers threw more first-turn blocks (2.6 v 1.6) and knocked more down,
  but failed far more dodges on turn 1 (8 v 1 in ~90 drives) pulling players out of contact to support the ball, and
  didn't score more. With 5 on the line (`recvLine`, AIX.p): 59-58, 21-23 over 72; both halves together 37-34, 16-14
  over 48. Released with 5. The next step would be the receivers' first turn itself: block with the line, move the
  ball up behind it, and don't dodge out of contact to do it, after which 6-7 on the line may pay.

## The receivers' first turn (Oct 2026)
`fumbbl-firstturn.py` reads the receiving team's first turn after each kick-off in the 71 replays (245 turns);
`bb-firstturn.js` records the computer's the same way (`--bb` to compare). "In contact" = next to a standing opponent at
the start of the turn.

| | coaches | v3.63, 5 on the line | v3.63, 7 | with `line1` (v3.64) |
|---|---|---|---|---|
| in contact at the start | 4.9 | 4.9 | 5.1 | 5.0 |
| ...blocked / other action, no dodge / did nothing / dodged away | 58 / 24 / 14 / 3% | 45 / 23 / 15 / 16% | 45 / 20 / 17 / 18% | 59 / 24 / 9 / 8% |
| blocks a turn | 3.7 | 2.6 | 2.7 | 3.2 |
| ball picked up after (actions; blocks before it) | 7.9; 3.3 | 1.8; 1.0 | 1.9; 1.1 | 3.8; 2.9 |
| in contact at the end | 1.5 | 3.0 | 2.9 | 2.3 |

- Coaches block first and move after: knocking a marker over lets the player walk off without a dodge ("other action,
  no dodge" is mostly that). The ball comes late, once the blocks are done. 96% of their first-turn blocks are 2 or 3 dice.
- The computer took the ball first (step 4 of `choose()` came before ordinary blocks), then dodged line players away
  to build the cage. And agile teams (Wood Elf, High Elf, Amazon: `agileTeam`) only took near-safe blocks (pTurn 0.05),
  so their line players dodged away instead: 41-84% of them, against 11-14% for coaches with those teams, who block
  about 3 times on that turn like everyone else.
- `line1`: (a) with the ball loose and no standing opponent within 3 squares of it (`calmR`), the good blocks go before
  the pick-up; (b) an agile team's blocker who is marked anyway takes blocks up to pTurn 0.12, like other teams.
- Results against v3.63: line1 with 5 on the line 38-40 touchdowns, 14-15 wins (48 matches); with 7 on the line
  136-122, 43-40, casualties 204-172 (144). Released with 7 (5 for teams with fewer than six ST4+ or AV9+ players).
  Amazons in the mirror match still hardly block (blocking a Dodge player is rarely worth it), so they still dodge away.
