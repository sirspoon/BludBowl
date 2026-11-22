# BludBowl: shared notes

What's going on now, across all the sessions working on BludBowl (the owner's control-room chat, job sessions it starts, and
"BludBowl local" on the owner's PC, which does the AI work). **Read this first; before you finish, update it** (move your job
from "In progress" to "Recently done", note anything left open, drop entries that have gone stale). Keep it short: the
changelogs record every game change, `ai-training/README.md` holds the AI research in detail, and CLAUDE.md the standing rules.

## In progress
- **Brain x (v5.18, the owner's plan, 18 Nov): make the AI a real challenge for drefsante, Humans v Humans.** Work goes into the
  experimental brain (`'{"brain":"x"}'`; code behind `AIX.x(team)`, its own tuning values in `AIX.X`), not the game's AI, so it may
  test worse for a while. Measure each step v drefsante (`nn/evaluate.py --model bludbowl --opponent drefsante --rules season3
  --teams human --aip '{"brain":"x"}'`, seeds 900000 x100 + 901000 x200; ~1,000 games for small effects) against the game's AI or
  the frozen v5.17 (`--html ../baseline-v5.17.html`, made with `git show 9e05816:index.html`). Make x the default when it clearly
  beats the current AI v drefsante and isn't clearly worse in the all-races mirror guard (`tools/ai-match.js --newp '{"brain":"x"}'`).
  Leave helpers the game's AI uses unchanged (fork them for x) so the default doesn't drift.
  Brain x so far: v5.19 `fr1` (Blitz their free receivers, `frW`) left at 0 - free receivers didn't fall, frW 3 did worse.
  v5.20 `cd1` (close free receivers down, `cdN`): free receivers halved but drefsante scored as much and we scored less (1,000
  games: 159-232-609 v 185-247-568); `tg1` (Catchers worth more to hit, `tgW`): hardly more hits, 164-251-585. 1,000-game
  baseline for today's AI v drefsante (seeds 910000+): won 185 drew 247 lost 568, touchdowns 655-1393 (`nn/look/dbg/k_base.txt`).
  Lesson: its scoring adapts - cutting one route doesn't cut its touchdowns. The bigger gap is our attack: from 11+ squares out
  drefsante scores in 14% of its turns with the ball, we in 1%.
  v5.21 `qb1` (Thrower as quarterback, `qbN`): off - our Thrower carried twice as often but had nobody ready to throw to (ready
  receivers 11+ out 2-6% of turns even with deep1 forced: drefsante's defence keeps them covered) and we scored less (147-168 v
  201-216 touchdowns in 300). The far-out gap is mostly its defence covering deep and ours not: both lose the ball about as often
  (ours 9% in our turn + 33% in theirs, its 14% + 32%). Scripts: `nn/look/drives_report.py`, `nn/look/dbg/far_scores.py`.
  Noise check (same AI, same 300 seeds 750000+, `nn/look/drefstudy.py --positions`): drefsante won 167 v 177, touchdowns 425-201 v
  447-216 - differences of ~10 wins in 300 are luck.
  Shadow study (18 Nov, `nn/look/dref_shadow.py` + `dref_shadow_report.py`, 300 games, report `nn/look/dref/rep_shadow.txt`): at
  each of our AI's 39,000 player choices a second copy of drefsante's brain said what it would do. It picks the same player only
  22-43% of the time (order differs a lot). Clearest differences: (1) we end the turn with players unused where it would still
  throw a block - 35% of our defence turns, 28% loose-ball, 22% attack - nearly all 1-die blocks (it throws 1-die blocks 3x as
  often on defence); (2) on defence it sends a deep safety: 23% of its moves end 8+ squares goal-side of their carrier, ours 5%,
  and 88% of its moves end marking someone (ours 72%); (3) its Blitz goes at the carrier more (36% of its block targets v 26%);
  (4) in attack it moves before it blocks (we start 44% of turns with a Blitzer block/Blitz, it 7%), gets more players ahead of
  the carrier (77% v 56%) and cages less; (5) with the ball loose it sends receivers upfield first, then picks up.
  Tried (1), no code change: `blk1`'s end-of-turn block limits loosened (`lateTurn` 0.4, `lateDown` 0.3, so any player, not
  just Blitzers with Block). Unthrown blocks fell (defence 399 -> 41 turns) and our 1-die blocks doubled (3.7 -> 7.6 a game,
  drefsante's level), but over 1,000 games (seeds 910000+, `nn/look/dbg/k_lb1.txt`) we did worse: 159-219-622 v 185-247-568,
  touchdowns 613-1449 v 655-1393. Kept at 0.2 / 0.4 - our players lying down at the end of the turn seem to cost more than the
  knock-downs gain.
  v5.22 `ds1` (deep safety, `dsN`, `dsAt` 5, `dsFrom` 11): off. drefsante's "deep" defenders turned out to be mostly marking its
  receivers 5 squares out (98% next to one), and whole-team setups are closer than the per-move figures suggest: at the attacker's
  turn start it has 1.28 players 8+ goal-side of the carrier v our 0.78, and marks the carrier 66% v 47%. After the screen `ds1`
  was hardly reached (`formationPlan` stops at the first target with no mover), so it goes before it. 1,000 games: 165-242-593,
  touchdowns 603-1361 v 185-247-568, 655-1393 (`nn/look/dbg/k_ds2.txt`): 32 fewer conceded, 52 fewer scored. As with `cd1` and
  `def2`, players sent back cost more in attack than they save.
  Openings study (owner's question: can the AI plan a turn around key moves? `nn/look/dbg/openings.py`, `openings2.py`, on
  `study_pos.jsonl`, 300 games): "open" = at the start of a turn with the ball, a score is on for 0-1 dice rolls (dodges + Rushes,
  +1 for a hand-off or pass to a team-mate who runs it in; generous: any player may throw, catches not counted). Open by the carrier
  running: drefsante 9%, ours 9%. Open only through a team-mate: drefsante 29%, ours 1% - that is the gap. Carrier 11-15 squares
  out: open 44% v 1%, scored 17% v 1%. One knock-down that opens a score that same turn is rare (ours 3.7% of turns, its 2.7%), so
  a game is opened the turn before: a receiver in place, surviving their turn. Part of the gap is each side's defence (ours leaves
  receivers free, its covers them). drefsante is rule-based too, no search, but its rules are built round the ball and its
  receivers. Proposed for brain x: one all-routes "rolls to score next turn" measure, used to choose a two-turn plan and to name
  the defenders worth hitting (those covering or able to reach the carrier/receiver).
  v5.23 `tp1` (`turnPlan`), the first such plan, is ON in brain x (`AIX.X`: `tpN` 1, `tpRoute` 0): one finisher placed for a score next
  turn, before any dice. With the carrier 9-16 out drefsante had someone within a run of the end zone in 78% of turns, we 18%
  (`nn/look/dbg/open_funnel.py`). Score on from 11-15 out 1% -> 7%; touchdowns from 11+ out 2-10 -> 39 (300 games), with a hand-off 13-14
  -> 53, but from 0-6 out 100-105 -> 73: the total didn't rise. 1,000 games (`k_tp3.txt`): 173-221-606, 665-1454 v 185-247-568, 655-1393.
  Two finishers, or ones sent forward early, did clearly worse (31-63-206, 42-56-202: stranded upfield when the ball changes hands;
  variants via `nn/look/dbg/tp_runs.sh`). So scoring sooner isn't scoring more, and the cost is on defence.
  v5.24 `dp1` (`dpThreat`), the plan in defence, ON in brain x (`dpN` 3): their chance of scoring next turn over all routes; sure moves
  that cut it most, and their finishers worth more to hit. Its turns with a score on through a team-mate 30% -> 10%, from 11-15 out 48% ->
  8% (300 games, `study_dp3.jsonl`). 1,000 games (`k_dp3.txt`): 188-241-571, 646-1382 - level with today's AI (185-247-568, 655-1393), up from
  `tp1` alone (173-221-606, 665-1454). `dpN` 1: 183-239-578, 618-1358. It still scores from closer in: it advances instead.
  v5.25 `bp1` (`bpEnd`), protecting the ball, ON in brain x (`bpN` 4). Lost in the opponent's turn 41% of the time, by how many can reach the
  carrier with no dodge: 0 -> 10%, 1 -> 21%, 2+ -> 54-67% (`nn/look/dbg/ball_loss.py`). Carrier's stopping square chosen for that, up to 4 sure
  moves before any dice to shut the ways to him, whoever could reach him worth more to hit. Reach 2.30 -> 1.40, lost in our turn 9% -> 6%, in
  theirs 41% -> 35%. 1,000 games (`k_bp4.txt`): 207-245-548, 697-1337 v today's AI 185-247-568, 655-1393 - the first brain x ahead, by about
  1.2 standard errors (promising, not proven; not yet tried in the all-races guard).
  v5.26 `lb1` (loose ball, `lbOn`): OFF. drefsante, receiving a kick-off, has the ball at turn end 86% with few Turnovers: it throws 2.3 very safe
  blocks and picks up last (5% of those turns end in a Turnover before the pick-up, ours 17%; `nn/look/dbg/loose_ball.py`, `kick_follow.py`). `lb1`
  (plan's sure moves, very safe blocks, pick-up): ball at turn end 66% -> 77%, at our next turn 60% -> 70%, gone within two turns. 1,000 games
  (`k_lb2.txt`): 194-261-545, 627-1268 v 207-245-548, 697-1337 - same margin, lower scoring. Worth a look next: loose balls in our own half
  mid-drive (we concede within 3 turns 27-31% of the time; drefsante gets 583 loose-ball turns near our end zone per 300 games and scores within 3
  turns in 43%), and blocks (the plan's moves cut ours: 42 -> 40 a game, knock-downs 27 -> 26, while drefsante's rise to 49).
  v5.31 `cb1` (loose ball in our half, `cbN`): OFF. Its players who can reach the ball with no dodge: 0 -> it gets the ball 26%, 1+ -> 53-74%; ours next to the
  ball: 0 -> it scores within 3 turns 43%, 3 -> 4% (`nn/look/dbg/loose_ours.py`). Sure moves to cut that, hits on those who could reach it: it got the ball 48% ->
  40%. 300 games looked great (73-71-156, 209-348) but 1,000 (`k_cb2.txt`): 202-245-553, 643-1268 v 207-245-548, 697-1337. `lb1` and `cb1` both took ~70 touchdowns
  off each side: more care around the ball slows our attack as much as theirs. Trust 1,000 games, not 300. `cbKeep` (hold players back for a Blitz) was no help.
  v5.33 blocks: all OFF. `nn/look/dbg/block_gap.py` (per turn, drefsante | ours): on defence 3.15 | 2.29 block rolls, ball loose Blitzes .89 | .38; about 4.4 of the
  ~10 blocks-a-game gap is 1-die blocks. 1,000 games v 207-245-548, 697-1337 (.330, margin -.640): `bk1` (`bkD` 1, 1-die blocks on defence at turn end, `lateWorth`)
  205-247-548, 679-1350 (.329, -.671; 1-die 4.4 -> 5.7, knock-downs 25.7 -> 26.0); `bzMin` 1.5 + `bzDef` 1 181-234-585, 674-1415 (.298, -.741); both 175-256-569,
  668-1383 (.303, -.715). `k_bk1-3.txt`. Throwing more blocks doesn't close the gap: the count is a symptom, not the cause. Don't lower the Blitz bar.
  v5.34 block targets and order (`nn/look/dref/study_blk.jsonl`, made with `drefstudy.py --blocks`: the board at every block; `look/dbg/block_order.py`,
  `block_sources.py`, `blitz_look.py`): freeing assists with an earlier block, level (8.0 v 7.8 blocks a game helped); other 2-dice blocks level; the gap is
  the Blitz (drefsante 82% of turns, 92% on 2 dice, as its 2nd-5th action; ours 60%, 77%, 57% as the 6th+; 13.0 v 8.9 Blitz blocks a game). On defence we
  make 4.3 moves before the first block, it 2.3. Targets: it hits whoever's there (Linemen); we pick Blitzers, pass up Catchers (8% of picks, 28% on offer).
  `be1` (early Blitz, `beAt`): OFF - Blitzed early in 87% of turns, but 1,000 games 192-272-536 676-1294 / 189-256-555 646-1310 / 199-250-551 683-1319 v
  207-245-548 697-1337; blocks fell to ~37.7, knock-downs 25.3. `k_be1-3.txt`. Counting and timing blocks like drefsante doesn't move the score.
  How drefsante scores v brain x (19 Nov, `study_blk.jsonl`, 300 games; `nn/look/dbg/score_paths.py`, `carrier_half.py`, `carrier_hits.py`, `carrier_dice.py`, outputs `.txt`):
  63% of its touchdowns come right after taking the ball off us (0.85 a game; 35% of all after Blitzing our carrier), 75% of those within 2 of its turns;
  ours 44% (0.29 a game). Spells with the ball: 3.8 a game each; it scores in 36%, we 17%. 80% of the touchdown gap is spells starting within 12 squares
  of scoring: it gets 1.52 a game and scores 50%, we 0.58 and 34%; from further out 0.59 v 0.45 touchdowns a game. Why: our carrier spends 5.4 of its
  turns a game in our half (its carrier 2.8 in its half) and is lost 36% v 25% a turn there. Not the setup: by the best dice a hit could have once
  their free players step in to assist (`carrier_dice.py`), both carriers in their own half are as exposed (2 dice 25-26% of turns, 1 die 22%, none
  45-47%), but at each level we lose it more (72 v 51%, 41 v 30%). (Human Catchers are ST3 in season3: carrying with a Catcher costs nothing.) It's the
  hit on the carrier: once it can reach ours it hits him ~64% of turns, mostly on 2 dice; we hit its carrier in its half ~47%, after 5 moves first
  (it: 2), and when we don't, our Blitz went at someone else 55%. Next: hit their carrier first when he's reachable (assists stepped in first).
  v5.37 `ca1` (`caPlan`: assists stepped in first, then the Blitz on their carrier at once; `caAt` 1, `caGain` 0.04, `caN` 3) ON in brain x. 1,000 games
  (`k_ca1-3.txt`): 210-269-521, 790-1362 (.345) v 207-245-548, 697-1337 (.330); caAt 2 (Blitz after the screen) 203-267-530, 706-1332. 300 games
  (`study_ca3.jsonl`, 282 done - the run stalled at the end): 1-die hit open on their carrier in its half, hit 47 -> 55%, on 2+ dice 55 -> 76%, after
  5.3 -> 1.7 moves, ball lost 35 -> 44%. Brain x's 1,000-game baseline is now 210-269-521, 790-1362. Not yet in the all-races guard.
  Tried after it, not kept: `kh1`, blocking the carrier's helpers away before the Blitz (one of ours already next to a helper, no move). In 5 mirror
  matches it never paid: usually none of ours stands next to a helper (only a Blitz could get there), and when one does the assist gained is worth
  less than the Turnover risk and that player's own hit. drefsante hardly does it either (0.19 blocks before its hit on our carrier; ours 0.57).
  All-races mirror guard, v5.37 brain x v the game's AI (`tools/ai-match.js`, 31 races x 20, `nn/look/dbg/guard_v537.txt/.jsonl`): won 212 drew 192
  lost 216, touchdowns 562-568 (margin -0.01 a match, se 0.05): level; no race clearly off (worst khorne/orc/renegades -0.35, se 0.25). v drefsante it is
  ahead of the game's AI by 0.17 touchdowns a game of margin (.345 v .308 score share, ~2 se, same seeds). Making x the default is the owner's call.
  v5.38: `bpProg` 0.1 in brain x (was 0.025; what a square of carrier progress is worth against safety in `bpEnd`). Why: in `study_v537.jsonl`
  (300 games, seeds 760000) our carrier 13-18 out gains nothing in 51% of own turns (drefsante 28%), avg gain 2.5 v 2.9; our spells score 18.9% v its
  35.3%, and 26.9% end at half time. 1,000 games v drefsante (`k_pg2.txt`, `k_b930.txt`, `k_pg2s.txt`): seeds 910000+ 229-261-510, 807-1348 v
  210-269-521, 790-1362; seeds 930000+ 229-241-530, 798-1365 v 204-249-547, 748-1425 (score share .355 v .337 over 2,000, ~1.4 se). Not kept:
  bpProg 0.06 (.330), 0.15 (.332), bpGive 1 (.336). Brain x's baseline is now 229-261-510, 807-1348 (seeds 910000+). Not in the all-races guard.
  Tried after v5.38, not kept: `eh1`, the turn before the last with the ball: the carrier ends on the square worth most by (not stripped, bpLoss) x
  (scores next turn: within MA 85%, +1 Rush 72%, +2 60%, else 10%) less their chance of scoring if they get the ball there (drefsante, by squares to go
  and own turns left: 0-6 63%, 7-10 53/40%, 11-14 44/33%, 15-18 21/32%, 19+ 17%), dodges and Rushes down to 50%; bp1's step back skipped when it picked.
  Why: `nn/look/dbg/late_half.py` (study_v537): our turn 7 with the ball 13-18 out, at turn 8 still ours 53% but within MA+2 only 16% (from there
  we score 69%, from further 11%). 1,000 games v drefsante (seeds 910000+, v5.38 229-261-510, 807-1348): as built 215-262-523, 808-1382; sure moves
  only 211-245-544, 776-1365; a first version that also dropped bp1's step back on every turn 7: 211-220-569, 741-1386 (and 218-244-538 v 229-241-530
  on seeds 930000+), with their scoring chance x1.5 212-244-544. None better: code removed (the patch is described here if it's wanted again).
  Losing the ball early (19+ out; study_v537, `score_paths.py`, `nn/look/dbg/marked_carrier.py`): we lose it there 0.67 a game v drefsante's 0.36,
  but mostly because we start more drives deep (1.72 v 1.13 a game: we receive more kicks, it scores more); per drive starting 19+ out, 39% v 32%
  lost before 19. Ours more often: pushed into the crowd 0.087 v 0.007, knocked over by a plain Block 0.083 v 0.003 (carrier left marked). Our carrier
  marked at the start of our turn (13+ out) stayed and ended it still marked 127 times in 300 games (drefsante 24); ball gone by our next turn 75%
  (moved clear: 37%); 65 of those after a Turnover ended our turn before he moved (31 from blocks away from him). Tried, not kept: `mk1`, with our
  carrier marked and still to move only blocks on his markers or near-safe (pTurn < mkTurn 0.05) ones before him, the rest after. Stranded after
  a Turnover 65 -> 56 (`study_mk1.jsonl`); 1,000 games v drefsante: seeds 910000+ 242-245-513, 833-1361 (v5.38 229-261-510, 807-1348), seeds
  930000+ 214-221-565, 747-1415 (v5.38 229-241-530, 798-1365); mkTurn 0.1 228-226-546, 769-1375. Not better; too small a lever (~0.1 balls a game).
  v5.40: `bpEdge` 0.15 in brain x (edgeRisk counts against the carrier's stopping square in `bpEnd`; bpCount alone favoured the sideline). Study
  (study_v537): our carrier on the sideline at drefsante's turn start 0.96 a game v 0.37 (moved there 0.34 v 0.08), but not lost more there (26% v
  33% in the middle; 48% when he stayed there). 1,000 games (`k_ed1.txt`, `k_ed1s.txt`): 226-277-497, 817-1357 and 216-256-528, 790-1388 v
  229-261-510, 807-1348 and 229-241-530, 798-1365 - level (.354 v .355), kept as coach-like. Not in the all-races guard.
  v5.41 (20 Nov): BotBowl bridge fix. A player who picked the ball up on the move stopped on the ball's square in BotBowl (the bridge sent only
  the route to the ball; in the game `runPlan` carries on with `carrierPick`); a pick-up on the way to a hand-off or pass threw from the ball's
  square (`leg2` dropped). Now the bot asks the bridge's `carry()` after the pick-up (shared `carryOn`) and the route includes `leg2`. Every
  drefsante result before v5.41 had this handicap (ideas that pay off after a pick-up - lb1, cb1, pus1 - may have been undersold; worth
  re-trying). Brain x v drefsante, 1,000 games (seeds 910000+, `k_fb0.txt`): 269-250-481, 951-1363 (.394) - the new baseline - v 226-277-497,
  817-1357 (.364) with the old bridge. Don't run two `evaluate.py` at once: drefsante's Java side throws errors (~5% of games, counted as 0-0
  draws in its totals; `look/dbg/k_tally.py` leaves them out). `look/dbg/k_chunks.sh` alternates runs in 250-game blocks for early reads.
  Tried on the fixed bridge, not kept (code removed): `ps1` (`psMin` 0.55), after a pick-up running in at the odds choose0's step 1 uses (55%
  with a re-roll, not carrierPick's 75% and never into a tackle zone): 235-239-471, 883-1333 (.375) v 250-238-466, 915-1301 (.387) (both
  side by side, errored games left out). Why it looked worth it (study_v540, `look/dbg/loose_score.py`): turns starting with the ball loose 0-7
  out, we scored that turn 0-1% (0.45 a game), drefsante 13-28% (1.22) - largely the bridge bug. `e2` (`e2N` 2), on the turn before the last
  up to 2 finishers (tp1's rules), the rest going as deep as they can, in reach of a move and a pass: 253-245-502, 958-1411 (.376) v the same
  seeds' 269-250-481, 951-1363 (.394) - it conceded more. Why it looked worth it (`look/dbg/last_far.py`): the last turn with the ball 13+
  out, we had an unmarked team-mate within MA+2 of scoring 12% of the time (drefsante 48-57%), threw 10-14% (56-66%), scored 6-8% (19-27%).
  Re-tried on the fixed bridge (same seeds, run one at a time): `lb1` (`lbOn` 1) 284-244-472, 979-1300 (.406; 21 games lost to errors and a
  hang replayed on their own seeds with evaluate.py's new `--only`) and `cb1` (`cbN` 4) 275-268-457, 977-1318 (.409) v .394 - both a little
  better (each about 1 standard error). Both together (`k_lbcb.txt`): 279-238-483, 906-1269 (.398) - no better, fewer scored.
  v5.42: cb1 (`cbN` 4) switched on in brain x (`AIX.X`) as not worse and coach-like; lb1 stays off. Not in the all-races guard.
  Tried after v5.42, not kept (code removed), 1,000 games each v v5.42's .409 (seeds 910000+): `pusBar` 0.45 (pus1 at the usual hand-off bar
  now the pick-up-then-hand-off works in BotBowl) 274-255-471, 916-1244 (.402). Secure the Ball rated with the team re-roll, as pPlan rates the
  normal pick-up (2+ twice 97%, so a Lineman's 3+ with a re-roll, 89%, no longer always wins), chosen with <= 2 squares left on the ball if as
  safe, else if 15 points safer: 262-254-484, 898-1312 (.389); only with no squares left (but this also dropped v5.42's own rule - secure when
  the normal pick-up is <= 75% - so it secured in 2% of pick-ups, not 7%): 263-239-498, 884-1307 (.383). Not tried: v5.42's rule plus
  "secure when out of movement and safer". `mc1`, marking their carrier (up to 2 free players a turn step with no dice next to him when he is
  7+ out; drefsante, when 2+ of its free players could, ends with 2+ next to our carrier 55% of the time, we 24% - `look/dbg/mark_def.py`):
  only did anything placed before the Blitz on him (36%), and then drefsante lost the ball no more often (in its own turn 7% -> 6%) and we
  scored less (300-game study, seeds 760000+, `study_mc2b`: 78-79-143, 266-389 v `study_v542` 93-76-131, 305-390). drefsante's marked
  carrier copes; ours doesn't (`look/dbg/marked_carrier.py`: still marked when drefsante's turn began 118 times in 300 games v 21).
  How drefsante frees its marked carrier (`look/dbg/marked_free.py`, 7+ out): it blocks his markers before he acts in 91% of those turns (1.2
  blocks, after 3.8 other actions; we 65%, 0.8, after 5.3, with a Turnover first 16% v 10%); then he walks off without a dodge 49% (we 21%),
  dodges 9% (24%), stays 12% (23%). `fc1` (not kept, code removed): with our carrier marked and still to act, the best block on a marker
  first (up to fcTurn 0.25 risk), else a Blitz on one, else he blocks the marker himself if safer than the dodge: marker blocks 65% -> 74% of
  those turns but nothing else moved, and 300 games (seeds 760000+) 73-64-163, 262-426 v 93-76-131, 305-390. Milder (fcTurn 0.12, blocks
  only): 1,000 games 268-249-483, 928-1317 (.393) v .409. Note: v5.42's .409 (k_cb3) was the best of several runs of nearly the same AI
  (fb0 .394, lbcb .398, pub45 .402) - picked because it scored best, so it likely flatters v5.42 by ~.01.
  v5.43: a person playing the game faces brain x by default (Settings -> Computer coach: Experimental / Classic, localStorage
  `bb-brain`; `AIX.person` is false in test runs - ?simtest, Playwright, jsdom - so the bridge, ai-match and headless runs still get Classic
  unless they ask for `{"brain":"x"}`). The owner wanted to play against it; Classic stays for comparisons.
  v5.44: the targeted Blitz, mid-turn, ON in brain x (`btOn` 1 + `beAt` 1; owner's targets - carrier, threat (dpHits, free receivers,
  deep runners, escorts), in our carrier's way, positional - on 2+ dice we choose; `btWorth`). Why: we Blitz in 61% of turns (drefsante 85%,
  mostly as its 3rd-5th action); 24% of ours had no Blitz and no Turnover - at the end of the turn no 2-dice target was left (`look/dbg/
  blitz_targets.py`). bt1 alone (late): Blitzes 8.8 -> 9.3 a game, study 79-79-142, 282-396 v 93-76-131, 305-390. With be1: 1,000 games v drefsante (seeds 910000+): 271-263-466, touchdowns 907-1264 (.403) v v5.42's 275-268-457, 977-1318 (.409) - level (fewer conceded, fewer scored).
  v5.45: `cbThreat` 0.4 ON in brain x (cb1 covers a loose ball only if one of theirs could get to it with no dodge - cbFree >= 0.4; the owner
  saw 4-5 run back after a kick-off). Receiving turns (`look/dbg/recv_retreat.py`): 3+ squares back 2.1 -> 1.8 (drefsante 1.9), ground given
  up 12.7 -> 11.0, ball held 73% either way; 1,000 games 261-268-471, 911-1308 (.395) v v5.44 (`k_bebt`) .403. Tried, not kept: `bpAlone`
  (bpEnd: a cost for finishing with nobody of ours next to the carrier and 2+ of theirs able to get at him - the owner's game, a run through
  the gap; `look/dbg/lone_run.py`: such runs 0.26 a game, ball gone 59%, drefsante 0.54): counting team-mates who could still get there as
  support changed nothing; strict (0.5) cut them to 0.16 but 750 games .374 v .409 - he held back and we scored less.
  v5.46: `bpDodge` 1 ON in brain x (bpEnd weighs dodges away for a marked carrier: success -> that square's bpLoss, failure -> bpFail 0.85;
  before, only staying and sure moves were weighed). `look/dbg/marked_opts.py` (marked at own turn start, 7+ out): we did nothing 23% (ball
  kept 31%), drefsante 11%; a 4+ dodge to a free square was there 95%. With it: nothing 17%, hand-offs 19 -> 25%, kept ~50% either way;
  1,000 games 270-244-486, 930-1306 (.392) v v5.45 (`k_cbt`) .395. Still open: with 3+ markers we do nothing 25% (drefsante blocks a marker
  with the carrier 30%, dodges 29%); and we are marked 2.8 times a game v 1.7-2.2 (prevention: where the carrier ends).
  v5.47: `bpBlk` 1 ON in brain x (bpEnd: a marked carrier weighs blocking a marker himself - fall -> bpFail, marker moved -> one fewer).
  Study: kept/scored 49 -> 56%; 1,000 games (seeds 910000+) 258-250-492, 929-1321 (.383) v v5.46 .392. Drift check (seeds 930000+, `k_d542`,
  `k_d546`, `look/dbg/k_chunks.sh` now takes SEED=): v5.42's settings (btOn/beAt/cbThreat/bpDodge 0) 263-284-453, 927-1288 (.405) v v5.46
  275-274-451, 924-1260 (.412) - the slide on seeds 910000+ (.409 -> .392 over v5.42-v5.46) was luck; over both seed sets level.
  Scoring from deep (21 Nov, after v5.47; `look/dbg/deep_ready.py`, `look/dbg/fwd_recv.py`): with the ball 11+ out we score that turn 3.3%
  (drefsante 8.6%); with an unmarked receiver in reach (within MA+2 of the end zone, within the carrier's MA+10) we score as often (23% v 20%)
  but have one at 11% of turn starts (31%) - at the end of our turn a receiver forward at 36% (drefsante 89-92%; still free at its next turn
  ~40% either side). drefsante carries with its Thrower 31% of those turns (ours: Catchers 50%) and scores 61 of 98 such touchdowns by a
  pass (ours 7-9). Tried, not kept (1,000 games each v v5.47 .383, seeds 910000+): `tpN` 2 .388 (receivers forward unchanged at 36%: nobody
  can reach a ready square with a sure move, so the cap isn't the limit); `tpRoute` 1 (everyone not yet ready steps towards it) .372, 64 more
  conceded; `tpRouteC` (Catchers only; code removed) .363, with tpN 2 .361 - forward 36 -> 43%, scored from 11+ 3.3 -> 4.3%, but more
  conceded; `qbN` 1 (Thrower as quarterback) stopped at 500 games .345 v .385, with tpRouteC .370. Players sent upfield cost the defence more
  than the scores they set up; drefsante's 89% must come with a sounder defence elsewhere. Reading (21 Nov): drefsante's blog
  (drefsante.blogspot.com, 2019-2025) - per-action success / Turnover chances, a priority order (safe first, ball actions first), TD search
  over run / hand-off / pass combinations; nothing on formations or weights. GrodBot's source is no longer in njustesen/botbowl.
  Testing (21 Nov): `nn/look/dbg/k_seq.py NAME 'AIP' --mode gain|notworse` - an early-stopping test (Wald's SPRT, blocks of 125, at most
  1,500 games) against a stored run of the release, not re-played each time. Default baseline v5.47 = `k_blk` + `k_b547` (3,000 games,
  .392; the 2,000 new games .396, k_blk's .383 was the low one). `gain` answers better / no gain, `notworse` not worse / worse, about 0.04
  apart; simulated (`--simulate`): an idea 0.04 worse is called in ~240 games, a level one ~650 (5% wrongly 'better'), a real +0.04 is found
  83%. Replayed over the deep-scoring runs it threw out each loser after 250-625 games (tpN 2, level, no verdict in 1,000). After a release:
  `--fixed 2000` builds the new baseline. Our tweaks' real differences are only ~0.01 (`look/dbg/metric_power.py`: true spread .011 v luck
  .014 per 1,000 games), so small gains stay out of reach - the test finds big wins and drops losers cheaply. `--metric td2` (TD difference
  capped at 2): ranks runs as score share does (correlation .99), ~20% fewer games; same verdicts on the replay, usually sooner. Repeatable
  games: the bridge seeds Math.random from each question and `evaluate.py` gives players fixed ids and seeds drefsante's dice and (patched
  jar, `drefsante/seeded/`) its player/team ids - our side now repeats exactly; drefsante still varies a little (thread timing?), and one
  difference shifts every later roll, so same-seed pairing gains nothing for now. `evaluate.py` prints each game's seed; `BB_ACTLOG=file`
  logs every action of both sides.
  Influence map (21 Nov, after v5.47; `nn/look/dbg/influence.py`): for each square, how soon each side gets a player there (moves, +3 a dodge,
  +3 to stand, over MA+2) and so who controls it. At the end of its own turns drefsante controls 54% of the pitch with as many players
  standing as us, we 44% (gap the same attacking, defending, loose ball); it stands ~1.2 squares further up in every phase, 43% of its
  standing players in contact v our 46%, and with the ball is spread wider (lengthwise sd 3.2 v 2.4). Tried in brain x (code in index.html,
  `imTimes`/`imValue`/`imPick`, switch `imW`, not released): formation moves count the control a square adds (imW per square) and players
  left over go where they add most. imW 0.5: our control 47 -> 56% (120-game study), but v the 3,000-game v5.47 baseline (.392) .288 after
  125 games (`k_seq`, no gain), 193 conceded; imW 0.1 .383 after 375 (no gain); imW 0.5 only without the ball (`imDef` 1) .320 after 125.
  Raw space control is a side effect of drefsante's shape, not what wins: chasing it pulls players off the screen and the carrier's paths.
  Next ideas: weight squares by relevance (their scoring routes - dpThreat's hot squares - in defence), or just stand further up.
  v5.48: `fwD` 2 ON in brain x (defending, screen / second line / deep / safeties two squares nearer their carrier; `look/dbg/depth.py`):
  players 3+ behind the ball 3.05 -> 2.49 (dref 2.40), mean place v ball -1.49 -> -1.38 (dref -0.7), deepest still 7.3 from our line
  (dref 9.0). `k_seq` (v v5.47 .392): fwD 2 .399 over 1,000 (no gain, level - released as asked, not worse); fwD 1 .363 after 375; fwD 2 +
  dpBack 0.02 .391 after 625. Baseline for v5.48: `k_fw2` + `k_b548` (3,000 games, .396; `k_seq.py`'s default).
  Scoring-route map (21 Nov, after v5.48; `influence.py` 'def_route'): their carrier's squares nearer our line within two turns, weighted
  by progress; we reach 91% (weighted) first, drefsante's defence 86%; less covered than usual -> conceded that turn 28% v 14% (dref 35% v
  7%). Tried as `imR` (formation squares and spare players by route value, defending only; code removed): route value 193 -> 227 in a
  120-game study, but `k_seq` v v5.48 .396: imW 0.1 .366 after 250, imW 0.3 .332 after 125 (no gain) - scored fewer, conceded the same.
  The one-turn route-cutting (dp1) already covers it; two turns ahead only pulls players off the counter-attack.
  Overnight auto-tuning (21-22 Nov; `nn/look/dbg/spsa.py`, SPSA over 18 weights/thresholds, 97 rounds of 72+72 games, ~14,000
  games, frozen v5.48): no gain. The rounds' own score share didn't rise (quarters .403 .409 .395 .399); the second-half average
  (dangerW 1.3->1.95, bpGain .03->.046, dpMin .1->.14, supW .5->.64, caGain .04->.056, btW 2->1.23, blkMin 1.5->1.24, blkTurn .17->.15,
  bkTurn .4->.46, bpEdge .15->.11; the rest within half a step) gave .390 after 625 in `k_seq` v .396 (`k_n1v`; NO GAIN). Most drift
  is the size of the noise (~0.5-1 step); dangerW (+2 steps, steadily) was the only one worth a test of its own: dangerW 1.95 alone
  (the carrier's fear of squares opponents can really reach, carrierScore) .388 after 375 in `k_seq` (`k_dw195`; NO GAIN). These
  values are flat near v5.48: the gains left aren't in re-weighting what brain x already does.
  Bridge audit (20 Nov, after v5.46; the owner asked after the pick-up bug): the bot's `BB_PLANLOG=file` logs each plan and what BotBowl then
  did with that player; `nn/look/dbg/plan_check.py` compares. 60 games (6,683 plans): every move not stopped by a failed roll ended on the
  planned square (4,196), every block hit its target (1,272), blitzes blocked (769 of 770: one stood up and had too little MA), hand-offs,
  passes and fouls were made, pick-ups carried on (85; 25 stopped on the ball - 17 with no MA left). Fallbacks over 3,000 games: 54 blitz
  targets, 4 passes. runPlan's extras the bridge lacks only touch Bloodlust (feedPick/feedMove) and Squig Herders (herdPick). Kick-off Charge
  and Quick Snap: the bot ends them at once, but BotBowl's ProcBot answers the kick-off player selection with SELECT_NONE for drefsante too, so
  in BotBowl neither side gets them (the game's AI does play a Charge; using them in BotBowl would be a small edge, not a fix).
  Fresh study of v5.42: `look/dref/study_v542.jsonl` (300 games, seeds 760000+), report `rep_study_v542.txt`.
  Bridge plumbing (tools only, 20 Nov): one question went unanswered and hung a run for 5 hours (Node idle), and ~20 games ended "bad JSON".
  `bludbowl_bot.py` now sends UTF-8 with plain newlines (text mode on Windows sent CR LF and read answers as cp1252), numbers each question
  (Node echoes `id`; stray or late lines are skipped and printed), gives up after `BB_BRIDGE_TIMEOUT` (120 s) and asks once more on a fresh
  Node (counted in `fallbacks` as "bridge restarted"); `bridge-server.js` prints any line it can't read to stderr. The cause of the hang is
  not known - if "bridge restarted" or "could not read question" shows up, those lines are the clue.
  Study files: `nn/look/dref/study_{pos,aa,x1,x1b}.jsonl`, reports `rep_*.txt`. Not doing for now: the special-action
  skills (Stab, Gaze, Breathe Fire) for other races.

## Recently done (newest first)
- v5.39 (job session, 19 Nov): **roster PDF easier to read in print**. `ROSTER_PDF.draw` tries type sizes `SIZES` (11pt down to 7) with
  `rosterPage(doc, S, z, last, extra)` and keeps the largest that fits one page (returns the spare room; a small team redraws with
  taller rows). Column widths come from the contents; names, numbers, characteristics, headings and box values bold; changed
  characteristics underlined too (shows in black and white). Paper: Letter for US/Canada/Mexico browser languages (`paper()`), else A4;
  `_draw(J, t, fmt)` takes 'a4' / 'letter' and the doc carries `_fit` {size, onePage}. Typical sizes: 16 skilled league players 9.5pt,
  worst-case 16 rows (3 Big Guys + Dribl & Drull, failing ruleset check) 8pt, small teams 11pt. Check: `tools/ui-tests/roster-pdf.js`;
  before/after pictures in `tools/ui-tests/roster-pdf-images/`.
- v5.35 (job session, 19 Nov): **shirt numbers** chosen by the coach. Saved players may have `p.nr` (1-99); `shirtNumbers(list)` (before
  CAREER) gives everyone's shown number (own, else lowest free in roster order), `freeNumbers`. Team Builder: the number under the
  arrows is a button (`data-nr`) opening `#tb-nrdlg` (set / swap on a duplicate / "Number all by order"); setting one fixes all the
  team's numbers (`CAREER.normTeam` then gives any newcomer the lowest free). Matches: `matchSquad` puts `nr` in `ovr`, `buildPlayers`
  sets `p.nr` for everyone, and every shown number uses `pNo(p)` (never `p.id`, which stays the engine's id). Roster PDF in roster order
  (v5.36, the owner's call), showing the numbers. Check: `node tools/ui-tests/shirt-numbers.js`.
- v5.27 (job session, 19 Nov): **Night Goblins** team (BB2025, pre-release from Reddit photos of the book: `RACES.nightgoblin`,
  `preRelease` note in the Team Builder). New traits Squig Rage / Squig Restraint (`squigRage`, `squigRolls`, `SQUIG.stats` counts
  rolls/fails/blocks); the roll is made with the other activation rolls (on commit), and a 1-2 "undeclares" the action. AI: forced
  Block target (runPlan), `squigVictimAI`, Herder positioning (`herdPick`, counted as `herd`). Rulesets can now ban teams (`r.ban`,
  `TRULES.allows`, a "Not allowed" box in the tiers editor); Tier 4 (GW and Sevens) is a guess.
  Check: `node tools/ui-tests/squig-rage.js`. Not done: the NN race list (`RACE_L` in `AI.bridge`'s nn view) doesn't include
  `nightgoblin` (left alone so NN_VERSION and the owner's models don't change: the race one-hot is just empty for them); no HD sprites.
  Open: once the book is out, check the roster and Squig Rage wording again (and GW's tier), and drop `preRelease`.
  v5.28: allowed in the GotG2 / UKTC examples after all (the owner's call: both Tier 5, UKTC 1,130k); sprites reworked
  (two Herders, foam hand and bugle, dealt one of each by `SPRITE_EACH`). v5.29-v5.30: sprites reworked over several rounds with
  the owner (approved in v5.30: one slim Lineman, foam finger on a slanting stick, bugle Herder, round Squigs with the miniatures'
  fangs and gums, Hopper legs out of its sides, Wrangler leaning back, Cave Squig dome helmet, shoulder pads in the secondary colour).
  The working scripts weren't kept in the repo; the sprites are plain grids in `SPRITES.nightgoblin` if they need touching up.
  v5.32: the foam-hand Herder's stick now runs below his chin (it was hidden behind his teeth). Job finished; home pitch is Mossy
  Flagstones, as the Goblins'.
- (18 Nov, no version) **Does our AI use special-action skills?** In BludBowl (`node tools/ai-special-actions.js <races> --n 3`, AI v AI
  mirrors, counts the action buttons it presses; 3 matches a race): yes for bombs, Chainsaw, Projectile Vomit, Ball & Chain (goblins),
  Throw Team-Mate (goblin, snotling, ogre, halfling), Kick Team-Mate (once); hardly ever Stab (1 in 9 Dark Elf / Skaven / Chaos Dwarf
  matches: it comes after every good block and needs a 25% armour break, so v AV10 never) or Hypnotic Gaze (0 in 3 Vampire matches:
  only used to free our marked carrier); never Breathe Fire (no AI code for it) or the Black Orcs' Troll's Vomit. In BotBowl
  (`nn/look/dbg/dref_skilluse.py --us`) even less: the bridge (`tools/botbowl/bludbowl_bot.py`) can't send Kick Team-Mate, Ball &
  Chain or Breathe Fire, and in 24 games it used Gaze once, bombs 7 times, Throw Team-Mate 5, no Stab / Vomit / Chainsaw (goblins
  Vomit / Chainsaw in BludBowl but not BotBowl: not looked into). Passive skills work in both (the rules apply them). Not checked:
  reactive choices (Dump-off, Diving Tackle, Shadowing, Pro...). (One Black Orc batch of 3 jsdom matches ran out of time; a rerun
  finished fine.)
- (18 Nov, no version) **v5.17's AI v drefsante, all races** (BotBowl, BB2025, random races each side, 300 games: seeds 900000 x100 +
  901000 x200; `nn/look/dbg/dref_allraces_bench.txt`, by race: `nn/look/dbg/dref_byrace.py`): won 108, drew 65, lost 127, touchdowns
  236-291 - much closer than Humans v Humans (52-79-169). No errors. Random pairs are noisy: a stunty team (goblin, gnome,
  halfling, ogre, snotling, underworld) v a non-stunty one loses whoever plays it (we won 4 of 53 as stunty, 33 of 42 v drefsante's
  stunty), so mirror races would be a fairer all-races test. Neither side stunty: 66-48-77, touchdowns 141-168. drefsante's
  Humans were its best team v us (we went 2-1-10 against them; ~10 games a race, so per-race splits are mostly luck).
  **But drefsante plays other races handicapped in BotBowl** (`nn/look/dbg/dref_skilluse.py`, 24 games, 12 races): its BotBowl
  interface (Java `FFAIProxy.playTurn`) can only send move / block / Blitz / pass / hand-off / Foul / stand up / Leap / Throw
  Team-Mate, so it never Gazes, Stabs, throws bombs, Chainsaws, uses Ball & Chain, Projectile Vomit, Breathe Fire or Kick
  Team-Mate (offered 1,600+ times, used 0), and it never threw a team-mate either (772 chances). Skills BotBowl applies by itself
  (Dodge, Side Step, Horns, Frenzy, Blood Lust, Foul Appearance, Stand Firm, Grab...) do work, and its brain knows those it is told
  about. It isn't told the BB2025-only skills, for its own players or ours. So all-races results flatter us; Humans stay the
  clean benchmark.
- (18 Nov, no version) **drefsante plays every race in BotBowl now, not just Humans.** Humans-only was Bot Bowl V's format (and
  BotBowl Season 3's one team), not a drefsante limit: its own app plays 24 LRB6 teams. Its BotBowl bridge
  (`drefsante/drefsante_bot.py` on the owner's PC, originals kept as `.orig`) crashed on other races; fixed there: skills sent to
  its Java only if it knows them (BotBowl's 1-79 minus Long Legs, Monstrous Mouth, Swoop, Swift Reaction, Timmm-ber - its map,
  `FFAIProxy.skillsFFAIOrder`, lacks those; BB2025's 80+ are new), Wrestle and the apothecary decided in Python (BB2025's D16
  casualty rolls aren't the numbers its Java expects), a missing `OutcomeType` import, and an empty or not-allowed plan ends the
  player's action instead of returning nothing. Check (`nn/look/dbg/dref_allraces.sh`, 4 mirror games a race v our AI): all 30
  races finish; one Nurgle game hit BotBowl's own "square taken" assertion (game.py:1352), not reproducible. So
  `evaluate.py --model bludbowl --opponent drefsante --teams <races>` can test us v drefsante with any team. (Its play for those
  races is LRB6-era and ignores BB2025-only skills.)
- (18 Nov, no version) drefsante's scoring turns position by position (300 games, `nn/look/drefstudy.py --positions`,
  `drefpos_report.py`, `drefpos_boards.py` draws them): 58% of its touchdowns start with a free receiver (a team-mate in hand-off /
  pass reach who can walk in without a dodge), 59% of those deeper than all our standing players, ~3 squares from our nearest.
  Marking them fails (Dodge); knocking them down is the likely answer - our Blitz goes to the carrier first.
- v5.17 (BludBowl local, no change to play): defence against deep receivers (`def2`, `defN` 1-2) tried and left off: marking the
  opponent's ready receivers cut drefsante's (0.86 -> 0.55 a turn) and its far-out scores (12% -> 10%), but v drefsante (same 100
  games) we did worse (won 11-12, lost 65-67, touchdowns conceded 147-151 v 17-26-57, 134 without): markers taken off the screen.
  `nn/look/drefstudy.py --aip` sets our AI's tuning values for the study runs.
- v5.16 (BludBowl local, no change to play): three-player scoring chains (hand-off + pass or pass + hand-off, any players; the
  owner's agile-team tactic) tried and left off (`chainBar` 9; 0.45 / 0.6 to try): rare (Humans ~1 in 12 matches, Wood Elves
  ~0.4 a match), convert about as promised when played (4 of 10), no gain in 288 all-race or 192 agile matches. Because Humans
  hardly ever chain, the drefsante target can't see it: for rare features the guard (and agile runs) are the only test.
- v5.15 (BludBowl local, no change to play): `ho2` (hand-off to a thrower, pass, run in - drefsante's fourth scoring plan) and
  `rcv2` (keep Catchers free as receivers: drefsante's Catchers score 81 of its 136 touchdowns, ours carried the ball in 219 turn
  starts and scored 26) tried and left off - v drefsante 300 games 52-64-184 v v5.14's 52-79-169. Lessons: changes this size move
  the score by 2-3 points, so a verdict needs ~1,000 games a version v drefsante (~27 min); and the AI moves the ball up the pitch
  by handing it to Catchers in space (blocking that cost a lot). drefsante's blog read for clues: see `ai-training/README.md`.
- v5.14 (BludBowl local): deep receivers on, in a quieter form (one quick player, never a Block player, only with no opponent
  free to get at the carrier, no formation strike squares). v drefsante 300 games: won 52, drew 79, lost 169 (touchdowns
  209-418) v 57-57-186 without; v the AI without it 288 mirror matches: won 109, drew 84, lost 95. **New test policy (the
  owner, 18 Nov): the target is beating drefsante** (`nn/evaluate.py --opponent drefsante --rules season3 --teams human`, 300
  games on seeds 900000 x100 + 901000 x200 so variants pair up); our own AI (ai-match, 12 races x 24 mirror matches) is a guard
  that mustn't be clearly worse. Never judge results from random race pairs: an A/A test with `nn/look/deep1_measure.js`'s old
  random pairs came out 41-32-23 (it now plays mirror matches).
- v5.13 (BludBowl local): deep receivers (`deep1`, from the drefsante study) tried and left off (`deepN` 0; `'{"deepN":2}'` turns it
  on). A quick free player goes deep before the blocks, to a square from which it could take a hand-off / short pass and run in
  next turn; plus "strike" squares in the formation. Ready receivers with the ball 11+ out: 2% -> 21-30% of turns, but scores
  from there only 0 -> 1.5% (from a carrier who isn't a thrower the passes were 4-40% shots; hand-offs need him within his move
  + 1). v drefsante (BotBowl, BB2025) 300 games: won 65, drew 65, lost 170 v 57-57-186 without (a little better, within luck);
  v the AI without it (ai-match, 12 races) 288: won 96, drew 81, lost 111 (leaning worse; our defence marks receivers left
  deep). `AI.debugThrow()`; `nn/look/deep1_measure.js` (ready receivers, far-out scores, AI v AI); `nn/evaluate.py --aip` /
  `tools/bridge-server.js` `BRIDGE_AIP` set tuning values for our AI in BotBowl. Ideas if it's taken up again: keep the Blitzer
  back, one receiver only, send it only when the carrier is safe, or bring the ball to the Thrower first.
- (18 Nov, no version) **How drefsante beats our AI** (200 games, BB2025, `nn/look/drefstudy.py` / `_report.py`): the gap is
  scoring from 11+ squares out (it scores in 15% of such turns, we 0.3%; a third of its touchdowns). It sends fast players deep
  and unmarked ahead of the ball ("ready receivers": 0.76 a turn v our 0.02), then hands off or throws to one who runs in; our
  AI gathers everyone round the ball, so its pass/hand-off-to-score check rarely gets a chance. Close in we score as well or
  better; Turnovers, blocks, casualties about level. Details: `ai-training/README.md`, "How drefsante beats our AI".
- (18 Nov, no version) **v5.12's AI v drefsante** (Bot Bowl V's winner) in BotBowl, Humans: BB2016 (its rules) 97 games: won 7,
  drew 15, lost 75, touchdowns 43-183 (one game hung in a set-up loop; the run was stopped there); BB2025 (ours) 100 games: won
  14, drew 22, lost 64, touchdowns 52-145, no errors. Blocks level (~45 a match each), casualties level: it simply scores far
  more (1.5-1.9 a game v our 0.4-0.5). For scale, v BotBowl's scripted bot we win ~60%. `nn/evaluate.py` now has a per-game
  time limit (`--game-limit`, 300 s) so a hung game can't block a worker, and drefsante's console is silenced in the workers.
  The dashboard shows these runs (restart dashboard.py after editing it: the page is served from memory).
- (17 Nov, no version) An evaluator trained on BludBowl's own matches (ev1; `nn/look/evalcollect.js`, `evaltrain.py`,
  `evalcheck.py`): 6,000 AI-v-AI matches, 370,460 positions. Better than bb_v3c (squared error on results 0.086 v 0.100, well
  calibrated, much less noise), but alone no better than a simple-facts model trained on the same matches (0.085), and only a
  little real positional knowledge on top (blend 0.080 v 0.083). Memorises matches after 1 epoch: the result is too noisy a
  target for 6,000 matches. The dashboard now shows evaluator collections and training. Details: `ai-training/README.md`.
- (17 Nov, no version) What the outcome predictor goes by (the owner's question; `nn/look/predfacts.js`, `predcheck.py`,
  `predprobe.py`; 12,670 turn starts from 400 AI-v-AI matches): simple facts (score, turn, the ball and how far up, players
  standing, re-rolls, races) explain 80% of its verdict, the "play" facts (can our carrier score this turn, its free run, who can
  reach it, loose-ball chains) under 1% more. It sees the biggest play (a carrier able to score now: +0.075 v +0.098 really) but
  beyond that its view is mostly noise for AI-v-AI games, and for real results it adds nothing over a simple-facts model. That's
  what the look-ahead leaned on. Next options: an evaluator trained on BludBowl's own matches with short-horizon targets; a model
  on simple + play facts; play-outs past the opponent's reply. Details: `ai-training/README.md`, "What the outcome predictor goes by".
- (17 Nov, no version) Look-ahead step 3, real matches (`nn/look/lookmatch.js`): one side chose a style (base / bash / safe) at
  each turn start by 6 play-outs each judged by the outcome predictor; the other the usual v5.12 AI. 288 matches: won 92, drew
  100, lost 96, touchdowns 258-262: no gain. It played more carefully (Turnovers 1386 v 1515, casualties caused 429 v 505);
  Dwarfs went 1-12-11. Styles picked base 37%, bash 31%, safe 32%: the styles barely differ (bash changes ~0.2 decisions a
  turn), so the pick is largely the play-outs' luck. On the way: the runner's first 24 matches were spoiled (it kept clicking
  the hidden "Confirm Lineups" button, restarting the match), which had also skewed step 2's positions to drive openers; play-out
  pages are now reused (`AI.reset()` leak and shared random numbers found and fixed in look/site's copy, checked exact with
  seeded dice) and the test clock is held in waiting pages: a look-ahead match 16 -> 3.3 minutes. Details:
  `ai-training/README.md`, "Look-ahead".
- v5.12 (BludBowl local): pick up and score on the last turn takes chances down to 2% (was 8%); level in 288 matches. Blocking
  first to clear the way for the pick-up / throw / receiver (`clearForScore`, the owner's idea) tried and left off (`pusClear` 0):
  fewer scores in the coaches' loose-ball turns (29% v 33%) and level in matches with more Turnovers. Most of the coaches'
  pick-up-and-pass scores (still about 2%) need a receiver far from the end zone to dodge or Rush in: long shots.
  `AI.debugPus()` shows what the check sees in a position (`nn/look/pusdebug.js` loads scoring-turn positions into it).
- v5.11 (BludBowl local): pick up and score (`pus1`): with the ball loose, pick up and hand off / pass to a team-mate who can run
  in, in one action (last turn: any odds; before: 70%+). Coaches' loose-ball scoring turns 29% -> 34% (hand-off ones 11% -> 21%);
  288 matches level (won 112, lost 110, touchdowns 272-253, more passes and hand-offs). Still 0% of the coaches' pick-up-and-pass
  scores (9 turns, mostly last-turn: 1-3 blocks first to free the receiver, then the throw; two are Throw Team-mate teams).
- (17 Nov, no version) Look-ahead, phase 1 step 2 (`nn/look/` on the PC): at 378 turn starts, 4 turn "styles" (the AI with
  different dials: base, bash, safe, score) each played to the end of the turn 6 times and judged by the outcome predictor.
  No style beats the usual play on average, but picking the best one per turn (chosen on half the play-outs, scored on the
  other half) gains +0.56 +- 0.36 points of win chance a turn. Next: real matches with the choice made live (about 6 hours of
  computer time for 288). Plan and details: `ai-training/README.md`, "Look-ahead".
- (17 Nov, no version) Tuning the AI's numeric settings all together by self-play overnight (SPSA, `nn/tune/spsa.js` on the PC):
  37 dials, 600 rounds of 48 matches (about 29,000). Nothing better found: the tuned set against the defaults over 11 checks
  won 361, drew 322, lost 373 (touchdowns 924-921), and in the final 288 won 92, drew 93, lost 103, touchdowns 240-240, with
  fewer blocks (38.8 v 44.8) and casualties. Not released. Per-dial effects from the logged matches: none clearly real. The
  dials are on a flat top; a step up needs new behaviour, not new numbers. Details: `ai-training/README.md`, "Tuning the dials".
- (16 Nov, no version) The 55% bar for a risky run in: not changed. The scoring-turn tester (`nn/tdturn.js`) had a fault - the
  play-outs after the first in one page were spoiled - so v5.09's "44% of coach-converted risky runs" was wrong: really 66% before
  `tdf1`, 69% with it. A 40% bar scored no more; 25% a little more in those positions but lost in matches (won 81, lost 111 of 288).
  Details and a fairer test design (all risky starts, not just the scored ones): `ai-training/README.md`, "Scoring turns".
  The harder scoring turns redone too: the AI scores 25% (not 12-15%): loose ball then run in 42%, then hand-off 14%, then pass
  0%; out of reach 18%. `pts1` (go in after a pick-up at 55%) barely helped there and lost in matches (won 93, lost 121): not kept.
- v5.09 (BludBowl local): scoring turns (`tdf1`), from replaying 365 FUMBBL scoring turns with the AI (`nn/tdturn.js`): it
  scores 99% of free walk-ins, but only 44% of coach-converted risky runs, 12-15% of turns needing a pick-up, hand-off or pass
  first. Most misses had no failed roll: it didn't try (a 55% bar for going in; blocks first; a stalling bug from v5.04, fixed).
  Re-roll use in those turns is about the coaches'. Open: the 55% bar, the carrier blocking instead of running, pick-up-and-score.
- v5.10: HD test, 1.5x (48x48) High Elves made from the originals (`?hd`); the 2x redraw moved to `?hd=64`.
- v5.08: HD White Lion redrawn (helm, lion head on the shoulder, clearer claws), owner's feedback.
- v5.07: HD High Elves redrawn after GW's 2026 miniatures so the positions tell apart at normal zoom (owner's feedback).
- v5.06 (BludBowl local): pick up and pass in one action (`pup1`), real throwers only: completions about 3x (56-17 over 288),
  results level. Passing now: last-turn passes (v5.03) and pick-up-and-pass (v5.06); open-play passes from a carrier still rare.
- v5.05: HD sprite test, High Elves only, behind `?hd` / Settings > HD sprites (test). See `tools/hd-test/README.md`.
- v5.04 (BludBowl local): the AI plans risky plays counting on a team re-roll when it would spend one (`rrp1`, the owner's
  idea): route odds with a re-roll for Blitzes, pick-ups and scoring. More risky plays attempted, results level-to-positive.
  Still open: the general caution (formation moves only at 80-100% odds, `okProb`) is untouched.
- v5.03 (BludBowl local): AI passing. Why it hardly threw: `switchPlay` treats a dropped pass as a 12-point loss, so ordinary
  passes never beat walking the ball up (2 passes in 12 matches between passing teams). Strong coaches pass ~0.31 times a team a
  match (from the replays' decisions), half on the last turn of a half: short throws that rarely score (SPP in league play). v5.03
  adds those last-turn passes (`pas8`): completions up (19-11 over 288 matches, 8-0 v BotBowl's bot), results level. Short passes
  to open team-mates in turns 1-7 and receivers-first (`pas1`, `rcv1`) barely changed passing and are left out
  (`ai-training/passing-2026-11.patch`): open receivers in safe range are rare. Pick-up-and-pass in one action (what coaches often
  do where the AI picks up and runs) isn't tried yet.
- v5.02 (BludBowl local): the AI re-rolls Bone Head / Really Stupid / Animal Savagery failures when the player's action
  matters (it never did; coaches 19%, now 17%). The choosier one-die block re-rolls are in the code but off (level alone, a
  little negative together). `tools/ai-match.js` now runs on the PC's installed Chrome, ~3x the jsdom runner, and takes `--oldp`.
- Race strength, FUMBBL v BludBowl's AI (control room, 15 Nov; `ai-training/race-strength/README.md`): the AI plays
  Snotlings (22% v FUMBBL 51%), Vampires (25% v 47%; 7 turnovers a match) and Ogres (28% v 40%) much worse than coaches, and
  hardly ever completes a pass; well-armoured teams (Dwarfs, Old World Alliance, Bretonnians, Undead) do far better against it.
- v5.01: Squigmobile sprite right edge fixed. v5.00: Star Player Da Red Gobbo's Squigmobile (Exhibition Play only; extra
  Bribe each half; Hail Mary bombs added to the engine); "What's new" rolled up for the major version.
- v4.96-v4.99: Chaos Wastes weather table and Chaos Wastes pitch (with its own music and crowd taunt). The weather choice is
  only offered for the Glory on the Gridiron 2 tournament, which is always played on the Chaos Wastes pitch.
- v4.94-v4.95: replays: a thrown team-mate carrying the ball keeps it (our own saved matches and FUMBBL replays).
- v4.75-v4.93: Rulesets (tournament packs, GW Matched Play, examples, your own; league/Sevens GW rules shown read-only),
  tournaments using rulesets, roster PDF with a ruleset check, Teams screen filter, Team Builder on tabs, styled menus
  everywhere, phone fixes (landscape summary, skill-tag taps).
- v4.32-v4.34 (BludBowl local): AI keeps the ball better (carrier routes, defensive screen, two safeties). v. BotBowl's
  scripted bot: about 60% wins, up from 55% at v4.24.

## Ideas and open threads
- **AI, defence: knock down their free receivers (from the position study, 18 Nov).** When the opponent holds the ball and has a
  team-mate deep with a free run in (in hand-off / pass reach of the carrier), Blitz or block that player down rather than the
  far-off, caged carrier. Test v drefsante.
- **For later (the owner, 17 Nov): drefsante's Bot Bowl 2023 replays.** All 40 of its Bot Bowl V matches as BotBowl replays
  (`.rep`, 13-28 MB each, ~780 MB) in the owner's Google Drive folder "Dres-script-ai-replays": v Overparameterized40kBot,
  motbot2, treeman and random, 10 each, 5 at home (`drefsante_VS_x_0/2/4/6/8`) and 5 away (`x_VS_drefsante_1/3/5/7/9`). Idea: replay them and ask our AI (`AI.bridge`, as with the FUMBBL decisions) what it would do at
  drefsante's decisions, to see where a strong scripted bot and ours differ. (Bot Bowl V was Humans only.) Not downloaded yet.
  Drefsante (Frederic Bair, scripted) won Bot Bowl V (2023): won 37, drew 0, lost 3, touchdowns 139-6 (MotBot2, NN + evolution +
  scripted, 33-0-7, 99-10; Treeman, MCTS, 19-1-20; an RL bot and random never scored). Round robin, 10 matches a pairing, BB2016
  rules, one fixed Human team, 2 minutes a turn (njustesen.github.io/botbowl/bot-bowl-v). No code or write-up for it is public that
  we found, so the replays are the way to learn from it (BB2016 rules: some decisions won't carry over to BB2025).
- **drefsante as an opponent (the owner's idea, 17 Nov): working.** v0.8 (blog drefsante.blogspot.com, `Drefsante_AI-0.8.zip`:
  the jar, `drefsante_bot.py` / `.cfg`, LRB6 rules) unpacked in `E:\python\projects\BloodbowlAI_312\drefsante` (the bridge's
  two settings reads now point at its own folder; originals kept as `.orig`); pyjnius 1.9.0 in the AI environment; the portable
  64-bit JDK 21 in `...\BloodbowlAI_312\java\jdk-21.0.13+9` (not on the system PATH). `nn/evaluate.py --opponent drefsante
  --rules botbowl --teams human` (Bot Bowl V's settings: BB2016, route-finding on; the bridge loads the jar in each worker).
  First 2 games: drefsante won 4-0 and 3-0 (our AI blocked more, 55 v 43 a match, but never scored). Its decisions are all
  in the jar (`be/drefsante/bloodbowl/ai`, compiled Java, no source or licence in the zip); the Python file only translates.
  Under BB2025 (`--rules season3 --pathfinding`) every game stopped at its first Blitz: BB2025 names a Blitz's target when
  it's declared, its bridge didn't, so BotBowl's default named the first player offered and the planned block was refused.
  Fixed in its `drefsante_bot.py` (`blitz_target`: name the player its planned block is aimed at): 4 of 4 games finish
  (drefsante won 3, touchdowns 8-3); left: small mismatches it recovers from (e.g. "forgo activation"). Its brain still plays
  LRB6, so BB2025 results favour us and BB2016 ones it. Speed: on a free PC a game takes ~15 s (drefsante 41%: its Java
  thinking 3.6 s, rebuilding its model from the team files 1.9 s; our AI 23%, ~5 ms a decision; BotBowl 36%). The ~160 s
  first measured was the evaluator's position collection (12 browsers) starving the CPU, not the bots. Route-finding off
  (now the default for `evaluate.py`; `--pathfinding` turns it on) saves ~20%; it can't change either side's play.
  `nn/look/dbg/dref_prof.py` and `bb_prof.py` time a game by part; `BRIDGE_TIMING=1` makes `tools/bridge-server.js` report
  load / answer times per question kind on stderr when it closes. Our AI's
  "secure the ball" doesn't exist in BB2016 (the bridge swaps it), so it's a little handicapped there; drefsante's author says
  it's "slightly less good" in BotBowl too. A full run waits for the GPU training (CPU).
- **Reading (the owner, 17 Nov):** BotBowl's papers list (github.com/njustesen/botbowl, docs/papers.md): the Blood Bowl AI
  challenge papers (2018, 2019), MimicBot (imitation + reinforcement learning, Bot Bowl III winner, 2021), and "Planning in the
  midst of chaos" (Humeau et al., IEEE CoG 2021: Blood Bowl as a Markov decision process; a framework, no bot or results). Its
  useful parts for us: planning levels (1 one player - where GrodBot-style bots and mostly ours sit; 2 a few players together;
  3 the whole turn; 4 the turn plus the opponent's reply - "expert coaches"; 5 several turns); a plan's odds as the product of
  its rolls, with the safe actions first and a look at the position if it fails; dice-free search for a touchdown in one turn
  with up to 3 players; and pointers to whole-turn search for many-action games (Online Evolution, Justesen et al. 2016;
  Evolutionary MCTS, Baier and Cowling 2018) and to predicting Blood Bowl 2 winners by classification (Gustafsson 2019).
- **Reading (the owner, 17 Nov):** Maastricht University student project, 2022, on BotBowl (Python;
  gitlab.maastrichtuniversity.nl/um-research-project-2022-01-group-15/ai-for-bloodbowl, branch `macro-actions`; no macro-action
  code despite the name, no write-up or results). A priority-list scripted bot (`mimicbot/scripted_bot.py`: score at 70%+ path
  odds, hand off to a scorer at 70%+ or on turn 8, blocks keeping the blocker up 94%+, blitz with Block players, cage at 94%+,
  ...), simpler than ours; a MimicBot re-implementation (imitation then A2C, value head; trained weights not loaded); and MCTS
  code (`mcts/`, tested only v random). Worth a look only for its MCTS if we search single actions.
- The AI Python environment (anaconda `bloodbowl_312`) now has scikit-learn (1.9.1). Its NumPy's BLAS is broken: `np.corrcoef`
  and matrix products crash the process without a message (exit 127); element-wise maths, torch and scikit-learn's gradient
  boosting work (its linear models will likely not).
- AI, small bug: `AI.reset()` doesn't forget the AI's plans kept by half and turn (`cageDest`, `claims`, `ttmHold`,
  `pas8Key`), so a second match in one browser session (or a resumed one) can start with the last match's turn plans (e.g. turn
  1's formation claims). Small; fixed only in look/site's copy so far.
- **HD sprites (v5.05-v5.10 test, waiting on the owner's verdict).** v5.10: the owner felt the 2x redraws lost the
  originals' character, so `?hd` is now the originals at 1.5x (48x48), upscaled by `tools/hd-test/x15.js` with light shading
  (+~10 KB raw per 4 sprites, any team in seconds); the 2x redraw stays at `?hd=64`. Lesson from v5.07: draw from the real miniatures (GW's
  Warhammer Community article has clean photos) and give each position its own silhouette and colour mass; fine detail alone
  doesn't tell players apart at normal zoom. The High Elves on a 64x64 grid (`SPRITES_HD`, `?hd`). The code
  already scaled sprites from their grid, so it took only a switch, a cache key, crouch scaling and 16 palette letters. Close up
  and on a phone (where a 64 grid is about one pixel per screen pixel) the extra detail shows; at 1x desktop it's slightly
  softer. Cost: +18.9 KB raw / +3.5 KB gzipped per 4 sprites; all ~214 sprites about +0.9 MB raw, +140 KB over the wire.
  Painting is ~4x slower but cached. A full redraw is roughly 40-50 hours of sessions with the drawing kit in `tools/hd-test/`
  (sprites as shaded shapes in code). If it goes ahead: load HD from a separate file only when on, or keep the art as code and
  draw at start-up; indexed PNG sheets are the other option. Details: `tools/hd-test/README.md`.
- AI: it rolls far fewer risky dice than strong coaches (failed dodges and Rushes with a re-roll available: about 0.6 a team a
  match against 3.2), so it spends half as many re-rolls on rolls. That's the general caution, a bigger topic.
- AI: at the end of its turn the AI leaves about one defender a free path to its ball carrier (strong coaches about 0.3), and
  loses the ball more often for it. Two screen attempts made little difference (see `ai-training/README.md`).
- AI, from the race-strength results: Vampires' Bloodlust handling (7 turnovers a match); Snotling and Ogre negative traits
  (re-rolls, the `rr3` work) and Snotling swarm tricks; breaking down armoured teams.
- **AI passing (partly done in v5.03, see above).** The owner is worried about it: the AI essentially never throws a pass. Measured 15 Nov: 0 pass
  attempts in 8 matches with pass-friendly teams (Humans, High/Wood/Dark Elves, Skaven, Elven Union) on v5.01 and on v4.31,
  1 in 8 on v4.11; 19 completions in the whole 870-match round robin (0.01 per team per match). It hands off about as often
  as coaches (0.6-0.75 v 0.46 a team a match). Strong FUMBBL coaches pass in about half their matches (at least 0.59
  passers per team per match). Long-standing, not a recent regression; the October attempts (`passing-experiments.patch`:
  `passv`, `recvfirst`) raised hand-offs and passes a little but didn't win more. See "Passing" in `ai-training/README.md`.
- Inducements the Glory on the Gridiron pack allows but the game lacks: Mortuary Assistants, Plague Doctors.
- Editable league and Sevens rulesets (only GW's are shown now); worth doing once there's a real league pack to copy.
- Teams screen filters: by league or tournament entered, team value, a name search.
- Installable app (PWA) for phones.

## Decisions to keep
- Rulesets: GW Matched Play is the default and can't be deleted; the two packs are examples (deletable = hidden, restorable).
  A team stores `t.rules`; a tournament stores `cp.rules`; computer teams are drafted to the tournament's rules.
- Star Players that are Exhibition-only use their own flag (not `secret`, which is for the chest-menu Stars) and never
  appear for league or tournament teams.
- "What's new" (CHANGELOG.md) is rolled up into one entry at each major version (v4.00, v5.00); CHANGELOG-FULL.md keeps all.
- Several sessions can push to `main`: pull and rebase first, and take the next free version number.
