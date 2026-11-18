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
  Study files: `nn/look/dref/study_{pos,aa,x1,x1b}.jsonl`, reports `rep_*.txt`. Not doing for now: the special-action
  skills (Stab, Gaze, Breathe Fire) for other races.

## Recently done (newest first)
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
