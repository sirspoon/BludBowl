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
- **Full replays** (every move, with positions) aren't available over plain web addresses. FUMBBL's client
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
So a better plug alone doesn't stop the leaks; their blockers knock screeners over before the carrier runs, which none
of these measures see. Still untried: keeping one or two players goal-side of every opponent who could take a hand-off.

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
